from typing import Optional, List
from pydantic import BaseModel, Field
from src.utils.file.file import File, FileOps

# 全局状态
class GlobalState(BaseModel):
    """全局状态定义"""
    project_material: File = Field(..., description="企业上传的项目资料文件")
    project_info: dict = Field(default={}, description="解析后的项目信息")
    course_content: str = Field(default="", description="生成的课程内容")
    student_tasks: List[dict] = Field(default=[], description="学生实战任务列表")
    student_results: List[dict] = Field(default=[], description="学生提交的成果")
    feedback_report: str = Field(default="", description="反馈给企业的报告")

# 工作流输入
class GraphInput(BaseModel):
    """工作流输入"""
    project_material: File = Field(..., description="企业上传的项目资料文件")

# 工作流输出
class GraphOutput(BaseModel):
    """工作流输出"""
    feedback_report: str = Field(..., description="反馈给企业的最终报告")
