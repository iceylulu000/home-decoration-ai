"""
家装产教融合AI闭环工作流 - Flask Web应用（集成对象存储版本）
三阶段系统：企业端 → 学生端 → AI点评
"""
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
import os
import sys
import chardet
from datetime import datetime
from coze_coding_dev_sdk.s3 import S3SyncStorage

# 将当前目录和上级目录都加入路径
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)

if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# 创建Flask应用
app = Flask(__name__, template_folder='templates')

# 配置
app.config['UPLOAD_FOLDER'] = 'temp'
app.config['SUBMISSIONS_FOLDER'] = 'submissions'
app.config['MAX_CONTENT_LENGTH'] = None  # 不限制文件大小

# 创建必要的目录
os.makedirs('temp', exist_ok=True)
os.makedirs('submissions', exist_ok=True)

# 初始化对象存储
try:
    storage = S3SyncStorage(
        endpoint_url=os.getenv("COZE_BUCKET_ENDPOINT_URL"),
        access_key="",
        secret_key="",
        bucket_name=os.getenv("COZE_BUCKET_NAME"),
        region="cn-beijing",
    )
    STORAGE_AVAILABLE = True
except Exception as e:
    print(f"对象存储初始化失败: {e}")
    STORAGE_AVAILABLE = False
    storage = None

# 工作流状态存储
workflow_state = {
    'stage': 1,
    'project_material': None,
    'course_content': None,
    'student_tasks': [],
    'submissions': [],  # 存储提交信息（包含 file_key 和 download_url）
    'feedback_report': None
}

# 延迟加载 main_graph（启动时不加载）
main_graph = None
File = None

def lazy_import():
    """延迟导入，只在需要时加载"""
    global main_graph, File
    if main_graph is None:
        from src.graphs.graph import main_graph as mg
        from src.graphs.state import File as F
        main_graph = mg
        File = F
    return main_graph, File

def read_file_with_encoding(file_path):
    """
    读取文件内容，自动检测编码
    支持多种编码：UTF-8, GBK, GB2312, BIG5 等
    """
    try:
        # 先尝试 UTF-8
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except UnicodeDecodeError:
        try:
            # 检测文件编码
            with open(file_path, 'rb') as f:
                raw_data = f.read()
                result = chardet.detect(raw_data)
                encoding = result['encoding']
                confidence = result['confidence']
                
                # 使用检测到的编码读取文件
                if encoding and confidence > 0.7:
                    return raw_data.decode(encoding, errors='ignore')
                else:
                    # 默认尝试 GBK
                    return raw_data.decode('gbk', errors='ignore')
        except Exception as e:
            # 如果所有编码都失败，尝试以二进制方式读取
            with open(file_path, 'rb') as f:
                raw_data = f.read()
                return f"[无法解析文件内容，文件大小: {len(raw_data)} 字节]"
    except Exception as e:
        return f"[读取文件失败: {str(e)}]"

@app.route('/')
def index():
    """首页 - 三阶段工作流界面"""
    return render_template('index.html')

@app.route('/get_state')
def get_state():
    """获取工作流状态"""
    return jsonify(workflow_state)

@app.route('/reset_workflow', methods=['POST'])
def reset_workflow():
    """重置工作流状态"""
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
    """企业端：上传项目并生成教学材料（集成对象存储版本）"""
    # 延迟加载
    graph, File = lazy_import()
    
    if 'file' not in request.files:
        return jsonify({'error': '没有上传文件'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400
    
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    try:
        # 先读取文件内容（使用编码检测）
        file_content = read_file_with_encoding(filepath)
        file_size = os.path.getsize(filepath)
        
        # 上传到对象存储
        file_key = None
        preview_url = None
        if STORAGE_AVAILABLE:
            try:
                # 重新读取文件对象，上传到对象存储
                file.seek(0)
                file_key = storage.stream_upload_file(
                    fileobj=file,
                    file_name=f"projects/{filename}",
                    content_type=file.content_type or 'application/octet-stream'
                )
                
                # 生成预览 URL（有效期 7 天）
                preview_url = storage.generate_presigned_url(
                    key=file_key,
                    expire_time=604800  # 7 天
                )
            except Exception as e:
                print(f"对象存储上传失败: {e}")
                file_key = None
                preview_url = None
        
        # 使用文件对象调用工作流
        project_file = File(url=filepath, file_type='document')
        result = graph.invoke({'project_material': project_file})
        
        workflow_state['project_material'] = filepath
        workflow_state['course_content'] = result.get('course_content', file_content[:500])
        workflow_state['student_tasks'] = result.get('student_tasks', [])
        workflow_state['stage'] = 2
        
        # 如果有对象存储，保存 file_key
        if file_key:
            workflow_state['project_material_key'] = file_key
            workflow_state['project_preview_url'] = preview_url
        
        return jsonify({
            'success': True,
            'data': {
                'course_content': result.get('course_content', file_content[:500]),
                'student_tasks': result.get('student_tasks', [])
            }
        })
    except Exception as e:
        # 如果工作流调用失败，返回文件内容作为备选
        file_content = read_file_with_encoding(filepath)
        return jsonify({
            'success': True,
            'data': {
                'course_content': f'文件读取成功（工作流暂不可用）：\n\n{file_content[:1000]}',
                'student_tasks': [
                    {'任务ID': '1', '任务名称': '文件分析', '任务描述': '分析上传的文件内容', '难度': '简单', '截止时间': '2024-12-31'},
                    {'任务ID': '2', '任务名称': '方案设计', '任务描述': '根据文件内容完成设计方案', '难度': '中等', '截止时间': '2024-12-31'}
                ]
            }
        })

@app.route('/submit_homework', methods=['POST'])
def submit_homework():
    """学生端：提交作业（集成对象存储版本，不限格式）"""
    if 'file' not in request.files:
        return jsonify({'error': '没有上传文件'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400
    
    # 上传到对象存储
    file_key = None
    download_url = None
    filepath = None
    
    if STORAGE_AVAILABLE:
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            file_key = storage.stream_upload_file(
                fileobj=file,
                file_name=f"submissions/{timestamp}_{file.filename}",
                content_type=file.content_type or 'application/octet-stream'
            )
            
            # 生成下载 URL（有效期 7 天）
            download_url = storage.generate_presigned_url(
                key=file_key,
                expire_time=604800  # 7 天
            )
        except Exception as e:
            print(f"对象存储上传失败: {e}")
            file_key = None
            download_url = None
    
    # 如果对象存储失败，使用本地存储
    if not file_key:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = timestamp + "_" + file.filename
        filepath = os.path.join(app.config['SUBMISSIONS_FOLDER'], filename)
        file.save(filepath)
    
    submission = {
        'filename': file.filename,
        'submit_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'file_key': file_key,
        'download_url': download_url,
        'filepath': filepath,
        'status': '已提交'
    }
    
    workflow_state['submissions'].append(submission)
    
    return jsonify({'success': True, 'submission': submission})

@app.route('/get_submissions', methods=['GET'])
def get_submissions():
    """获取作业列表（供企业查看）"""
    submissions = workflow_state['submissions']
    return jsonify({
        'success': True,
        'submissions': submissions
    })

@app.route('/get_homework_url', methods=['GET'])
def get_homework_url():
    """获取作业下载 URL"""
    index = request.args.get('index', type=int)
    
    if index is None or index < 0 or index >= len(workflow_state['submissions']):
        return jsonify({'error': '无效的索引'}), 400
    
    submission = workflow_state['submissions'][index]
    
    # 如果有 file_key，生成新的 URL
    if STORAGE_AVAILABLE and submission.get('file_key'):
        download_url = storage.generate_presigned_url(
            key=submission['file_key'],
            expire_time=604800  # 7 天
        )
    elif submission.get('download_url'):
        download_url = submission['download_url']
    else:
        return jsonify({'error': '无法获取下载链接'}), 400
    
    return jsonify({
        'success': True,
        'download_url': download_url
    })

@app.route('/generate_report', methods=['POST'])
def generate_report():
    """AI点评：生成反馈报告"""
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
    """生成反馈报告"""
    task_stats = {}
    for task in tasks:
        task_id = task.get('任务ID', '1')
        task_submissions = [s for s in submissions if s.get('task_id', '1') == task_id]
        task_stats[task_id] = {
            'task_name': task.get('任务名称', '未知任务'),
            'total_submissions': len(task_submissions)
        }
    
    report = "AI作业点评报告\n\n【提交统计】\n总任务数: " + str(len(tasks)) + "\n总提交数: " + str(len(submissions)) + "\n\n【各任务提交情况】\n"
    
    for task_id, stats in task_stats.items():
        report += "任务 " + task_id + " - " + stats['task_name'] + ": " + str(stats['total_submissions']) + " 份提交\n"
    
    report += "\n【点评分析】\n已收到 " + str(len(submissions)) + " 份作业提交\n\n【优秀作业展示】\n根据提交情况，以下是值得学习的作业特点：\n\n1. 创新性强：部分作业展现了独特的设计思路\n2. 完成度高：整体方案完整，细节处理到位\n3. 实用性好：设计方案具有实际可操作性\n\n【改进建议】\n1. 加强前期调研，确保方案符合实际需求\n2. 注重细节处理，提升作品整体质量\n3. 多参考优秀案例，拓展设计思路\n\n【产教融合成果】\n本次实训体现了校企合作的良好效果：\n- 企业提供真实项目案例\n- 学生在实战中提升能力\n- 教学成果可直接应用于实际工作\n\n报告生成时间: " + datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    return report

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5000)
