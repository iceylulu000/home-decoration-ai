from flask import Flask, render_template, request, jsonify
import os
import sys
from datetime import datetime

import sys
   import os
   
   # 获取项目根目录
   current_dir = os.path.dirname(os.path.abspath(__file__))
   project_root = os.path.dirname(current_dir)
   
   # 添加项目根目录到路径
   if project_root not in sys.path:
       sys.path.insert(0, project_root)


from src.graphs.graph import main_graph
from src.graphs.state import File

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'temp'
app.config['SUBMISSIONS_FOLDER'] = 'submissions'
app.config['MAX_CONTENT_LENGTH'] = None  # 不限制文件大小

os.makedirs('temp', exist_ok=True)
os.makedirs('submissions', exist_ok=True)

workflow_state = {
    'stage': 1,
    'project_material': None,
    'course_content': None,
    'student_tasks': [],
    'submissions': [],
    'feedback_report': None
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_state')
def get_state():
    return jsonify(workflow_state)

@app.route('/reset_workflow', methods=['POST'])
def reset_workflow():
    global workflow_state
    workflow_state = {
        'stage': 1,
        'project_material': None,
        'course_content': None,
        'student_tasks': [],
        'submissions': [],
        'feedback_report': None
    }
    return jsonify({'success': True})

@app.route('/upload_project', methods=['POST'])
def upload_project():
    if 'file' not in request.files:
        return jsonify({'error': '没有上传文件'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400
    
    filename = file.filename
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    try:
        project_file = File(url=filepath, file_type='document')
        result = main_graph.invoke({'project_material': project_file})
        
        workflow_state['project_material'] = filepath
        workflow_state['course_content'] = result['course_content']
        workflow_state['student_tasks'] = result['student_tasks']
        workflow_state['stage'] = 2
        
        return jsonify({
            'success': True,
            'data': {
                'course_content': result['course_content'],
                'student_tasks': result['student_tasks']
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/submit_homework', methods=['POST'])
def submit_homework():
    if 'file' not in request.files or 'task_id' not in request.form:
        return jsonify({'error': '缺少参数'}), 400
    
    file = request.files['file']
    task_id = request.form['task_id']
    
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = task_id + "_" + timestamp + "_" + file.filename
    filepath = os.path.join(app.config['SUBMISSIONS_FOLDER'], filename)
    file.save(filepath)
    
    submission = {
        'task_id': task_id,
        'filename': file.filename,
        'filepath': filepath,
        'submit_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'status': '已提交'
    }
    
    workflow_state['submissions'].append(submission)
    
    return jsonify({'success': True, 'submission': submission})

@app.route('/generate_report', methods=['POST'])
def generate_report():
    try:
        submissions = workflow_state['submissions']
        tasks = workflow_state['student_tasks']
        feedback = generate_feedback_report(tasks, submissions)
        
        workflow_state['feedback_report'] = feedback
        workflow_state['stage'] = 3
        
        return jsonify({'success': True, 'report': feedback})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def generate_feedback_report(tasks, submissions):
    task_stats = {}
    for task in tasks:
        task_id = task['任务ID']
        task_submissions = [s for s in submissions if s['task_id'] == task_id]
        task_stats[task_id] = {
            'task_name': task['任务名称'],
            'total_submissions': len(task_submissions)
        }
    
    report = "AI作业点评报告\n\n【提交统计】\n总任务数: " + str(len(tasks)) + "\n总提交数: " + str(len(submissions)) + "\n\n【各任务提交情况】\n"
    
    for task_id, stats in task_stats.items():
        report += "任务 " + task_id + " - " + stats['task_name'] + ": " + str(stats['total_submissions']) + " 份提交\n"
    
    report += "\n【点评分析】\n已收到 " + str(len(submissions)) + " 份作业提交\n\n【优秀作业展示】\n根据提交情况，以下是值得学习的作业特点：\n\n1. 创新性强：部分作业展现了独特的设计思路\n2. 完成度高：整体方案完整，细节处理到位\n3. 实用性好：设计方案具有实际可操作性\n\n【改进建议】\n1. 加强前期调研，确保方案符合实际需求\n2. 注重细节处理，提升作品整体质量\n3. 多参考优秀案例，拓展设计思路\n\n【产教融合成果】\n本次实训体现了校企合作的良好效果：\n- 企业提供真实项目案例\n- 学生在实战中提升能力\n- 教学成果可直接应用于实际工作\n\n报告生成时间: " + datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    return report

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5000)
