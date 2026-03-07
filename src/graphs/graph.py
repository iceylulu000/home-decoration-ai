from src.graphs.state import GlobalState, GraphInput
from src.graphs.nodes.project_parse_node import project_parse_node
from src.graphs.nodes.course_gen_node import course_gen_node
from src.graphs.nodes.task_gen_node import task_gen_node
from src.graphs.nodes.result_analyze_node import result_analyze_node

class HomeDesignWorkflow:
    """家装产教融合AI闭环工作流"""
    
    def __init__(self):
        self.nodes = [
            ("project_parse", project_parse_node),
            ("course_gen", course_gen_node),
            ("task_gen", task_gen_node),
            ("result_analyze", result_analyze_node)
        ]
    
    def invoke(self, input_data: dict) -> dict:
        """执行工作流"""
        print("\n" + "="*50)
        print("🚀 启动家装产教融合AI闭环工作流")
        print("="*50)
        
        state = GlobalState(**input_data)
        
        for i, (node_name, node_func) in enumerate(self.nodes, 1):
            print(f"\n📍 步骤 {i}/4: {node_name}")
            print("-" * 40)
            state = node_func(state)
            print(f"✅ {node_name} 完成")
        
        print("\n" + "="*50)
        print("🎉 工作流执行完成！")
        print("="*50)
        
        return state.model_dump()

main_graph = HomeDesignWorkflow()
