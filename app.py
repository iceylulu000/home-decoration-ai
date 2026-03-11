"""
家装产教融合AI闭环工作流 - Flask Web应用（测试版本）
"""
from flask import Flask, render_template, request, jsonify
import os
import chardet

# 创建Flask应用
app = Flask(__name__, template_folder='templates')

# 配置
app.config['UPLOAD_FOLDER'] = 'temp'
app.config['SUBMISSIONS_FOLDER'] = 'submissions'

# 创建必要的目录
os.makedirs('temp', exist_ok=True)
os.makedirs('submissions', exist_ok=True)

# 工作流状态存储
workflow_state = {
    'stage': 1,
    'project_material': None,
    'course_content': None,
    'student_tasks': [],
    'submissions': [],
    'feedback_report': None
}

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

@app.route('/upload_project', methods=['POST'])
def upload_project():
    """企业端：上传项目（测试版本）"""
    if 'file' not in request.files:
        return jsonify({'error': '没有上传文件'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400
    
    # 保存文件
    filename = file.filename
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)
    
    # 读取文件内容（使用编码检测）
    try:
        file_content = read_file_with_encoding(file_path)
        
        # 获取文件信息
        file_size = os.path.getsize(file_path)
        
        # 更新工作流状态
        workflow_state['project_material'] = {
            'filename': filename,
            'file_size': file_size,
            'content': file_content[:1000] + '...' if len(file_content) > 1000 else file_content,  # 只保存前1000字符
            'file_path': file_path
        }
        workflow_state['stage'] = 2
        
        # 测试版本：不调用工作流，直接返回模拟数据
        return jsonify({
            'success': True,
            'data': {
                'course_content': f'已成功读取文件：{filename}\n文件大小：{file_size} 字节\n文件内容预览：\n{file_content[:500]}',
                'student_tasks': [
                    {'任务ID': '1', '任务名称': '测试任务1', '任务描述': '测试描述1', '难度': '简单', '截止时间': '2024-12-31'},
                    {'任务ID': '2', '任务名称': '测试任务2', '任务描述': '测试描述2', '难度': '中等', '截止时间': '2024-12-31'}
                ]
            }
        })
    except Exception as e:
        return jsonify({'error': f'处理文件失败: {str(e)}'}), 500

@app.route('/submit_homework', methods=['POST'])
def submit_homework():
    """学生端：提交作业（测试版本）"""
    if 'file' not in request.files:
        return jsonify({'error': '没有上传文件'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400
    
    # 保存作业文件
    filename = file.filename
    file_path = os.path.join(app.config['SUBMISSIONS_FOLDER'], filename)
    file.save(file_path)
    
    # 生成AI评价（模拟）
    import datetime
    ai_feedback = f"""【AI评价结果】

1. 设计评分：⭐⭐⭐⭐
   - 方案设计合理，布局清晰
   - 建议进一步完善细节处理

2. 创意评分：⭐⭐⭐⭐⭐
   - 设计思路独特，有创新性
   - 色彩搭配富有想象力

3. 实用性评分：⭐⭐⭐⭐
   - 功能布局合理，满足基本需求
   - 建议优化空间利用率

总体评价：这是一份优秀的作业设计，展现了良好的设计思维和专业能力。继续保持！
"""
    
    # 记录提交
    submission = {
        'filename': filename,
        'submit_time': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'file_path': file_path,
        'ai_feedback': ai_feedback
    }
    
    workflow_state['submissions'].append(submission)
    
    return jsonify({
        'success': True,
        'message': '作业提交成功！',
        'ai_feedback': ai_feedback
    })

@app.route('/generate_report', methods=['POST'])
def generate_report():
    """生成点评报告（测试版本）"""
    if not workflow_state['submissions']:
        return jsonify({'error': '还没有提交任何作业'}), 400
    
    # 生成模拟报告
    report = f"""
## AI作业点评报告

### 提交概览
- 总提交数：{len(workflow_state['submissions'])}
- 评估时间：{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

### 详细评估
"""
    
    for i, submission in enumerate(workflow_state['submissions'], 1):
        report += f"""
#### 提交 {i}
- 文件名：{submission['filename']}
- 提交时间：{submission['submit_time']}
- 评估结果：✅ 提交成功，符合基本要求
- 改进建议：建议进一步优化方案设计，注重细节处理

{submission.get('ai_feedback', '暂无AI评价')}
"""
    
    workflow_state['feedback_report'] = report
    
    return jsonify({
        'success': True,
        'report': report
    })

@app.route('/reset_workflow', methods=['POST'])
def reset_workflow():
    """重置工作流"""
    workflow_state['stage'] = 1
    workflow_state['project_material'] = None
    workflow_state['course_content'] = None
    workflow_state['student_tasks'] = []
    workflow_state['submissions'] = []
    workflow_state['feedback_report'] = None
    
    return jsonify({
        'success': True,
        'message': '工作流已重置'
    })

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5000)
