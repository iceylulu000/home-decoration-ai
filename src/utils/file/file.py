import os
from typing import Literal
from pydantic import BaseModel, Field

class File(BaseModel):
    url: str = Field(..., description="文件URL或本地路径")
    file_type: Literal["image", "video", "audio", "document", "default"] = Field(default="default")

class FileOps:
    @staticmethod
    def extract_text(file: File) -> str:
        try:
            if os.path.exists(file.url):
                with open(file.url, "r", encoding="utf-8") as f:
                    return f.read()
            return f"[文件URL: {file.url}]"
        except Exception as e:
            return f"[读取文件失败: {str(e)}]"
