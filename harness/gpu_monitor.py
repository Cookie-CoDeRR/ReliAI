import subprocess
import re
import asyncio
import httpx
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


def get_apple_gpu_hardware_stats() -> Dict[str, Any]:
    """
    Directly queries the macOS IOKit IOAccelerator driver for Apple Silicon Metal GPU metrics.
    Returns real-time device utilization %, renderer utilization %, and allocated Metal unified memory.
    """
    try:
        out = subprocess.check_output(
            ["ioreg", "-r", "-d", "1", "-c", "IOAccelerator"],
            text=True,
            timeout=1.5,
            stderr=subprocess.DEVNULL
        )
        stats: Dict[str, Any] = {
            "gpu_vendor": "Apple Silicon (Metal)",
            "device_utilization_pct": 0,
            "renderer_utilization_pct": 0,
            "allocated_metal_mem_mb": 0.0,
            "in_use_metal_mem_mb": 0.0
        }
        
        model_m = re.search(r"\"model\"\s*=\s*\"([^\"]+)\"", out)
        if model_m:
            stats["gpu_model"] = model_m.group(1)
        else:
            stats["gpu_model"] = "Apple M-Series GPU"

        dev_util = re.search(r"\"Device Utilization %\"\s*=\s*(\d+)", out)
        if dev_util:
            stats["device_utilization_pct"] = int(dev_util.group(1))

        renderer_util = re.search(r"\"Renderer Utilization %\"\s*=\s*(\d+)", out)
        if renderer_util:
            stats["renderer_utilization_pct"] = int(renderer_util.group(1))

        alloc_mem = re.search(r"\"Alloc system memory\"\s*=\s*(\d+)", out)
        if alloc_mem:
            stats["allocated_metal_mem_mb"] = round(int(alloc_mem.group(1)) / (1024 * 1024), 1)

        in_use_mem = re.search(r"\"In use system memory\"\s*=\s*(\d+)", out)
        if in_use_mem:
            stats["in_use_metal_mem_mb"] = round(int(in_use_mem.group(1)) / (1024 * 1024), 1)

        return stats
    except Exception as e:
        logger.debug(f"IOAccelerator sampling error: {e}")
        return {
            "gpu_vendor": "Apple Silicon (Metal)",
            "gpu_model": "Apple M-Series",
            "device_utilization_pct": 0,
            "renderer_utilization_pct": 0,
            "allocated_metal_mem_mb": 0.0,
            "in_use_metal_mem_mb": 0.0,
            "error": str(e)
        }


async def get_ollama_gpu_vram_stats(base_url: str = "http://127.0.0.1:11434") -> Dict[str, Any]:
    """
    Queries Ollama /api/ps to retrieve loaded models resident in GPU VRAM and context sizes.
    """
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            res = await client.get(f"{base_url}/api/ps")
            if res.status_code != 200:
                return {"running": False, "models": []}
            data = res.json()
            models_info = []
            for m in data.get("models", []):
                vram_bytes = m.get("size_vram", 0)
                total_bytes = m.get("size", 0)
                vram_mb = round(vram_bytes / (1024 * 1024), 1)
                total_mb = round(total_bytes / (1024 * 1024), 1)
                pct_vram = round((vram_bytes / total_bytes * 100), 1) if total_bytes > 0 else 100.0
                models_info.append({
                    "name": m.get("name"),
                    "vram_allocated_mb": vram_mb,
                    "total_size_mb": total_mb,
                    "gpu_vram_pct": pct_vram,
                    "expires_at": m.get("expires_at")
                })
            return {
                "running": True,
                "model_count": len(models_info),
                "models": models_info
            }
    except Exception as e:
        return {"running": False, "models": [], "error": str(e)}


class LiveGPUSampler:
    """
    Asynchronous background sampler that monitors Apple Silicon GPU device utilization
    during LLM inference calls and captures peak and average GPU activity.
    """
    def __init__(self, sample_interval_sec: float = 0.15):
        self.interval = sample_interval_sec
        self.running = False
        self._task: Optional[asyncio.Task] = None
        self.samples = []

    async def _sample_loop(self):
        while self.running:
            stats = get_apple_gpu_hardware_stats()
            self.samples.append(stats.get("device_utilization_pct", 0))
            await asyncio.sleep(self.interval)

    def start(self):
        self.running = True
        self.samples = []
        self._task = asyncio.create_task(self._sample_loop())

    async def stop(self) -> Dict[str, Any]:
        self.running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        
        peak_util = max(self.samples) if self.samples else 0
        avg_util = round(sum(self.samples) / len(self.samples), 1) if self.samples else 0.0
        current_stats = get_apple_gpu_hardware_stats()
        current_stats["peak_device_utilization_pct"] = peak_util
        current_stats["avg_device_utilization_pct"] = avg_util
        current_stats["samples_collected"] = len(self.samples)
        return current_stats
