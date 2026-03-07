import os
import sys

# 添加项目路径到 sys.path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from graphs.graph import main_graph
from graphs.state import File

def main():
    print("
" + "="*60)
    print("  家装产教融合AI闭环工作流")
    print("="*60)
    print("
功能说明：")
    print("  1. 企业上传项目资料 → AI自动解析")
    print("  2. 基于真实项目 → 生成实战课程")
    print("  3. 自动生成学生任务 → 同步实战训练")
    print("  4. 分析学生成果 → 反馈企业报告")
    print("="*60)
    print("
开始运行...
")
    
    # 创建测试文件
    project_file = File(
        url="assets/test_project_material.txt",
        file_type="document"
    )
    
    # 执行工作流
    result = main_graph.invoke({
        "project_material": project_file
    })
    
    # 显示结果
    print("
" + "="*60)
    print("  📊 工作流执行结果")
    print("="*60)
    print(result["feedback_report"])
    print("="*60)
    print("
✨ 执行完成！
")

if __name__ == "__main__":
    main()
