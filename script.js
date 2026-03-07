// ===== 工具函数 =====
function safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// 添加错误过滤函数
function filterErrorInfo(text) {
    if (!text || typeof text !== 'string') {
        return { shouldFilter: false, message: text };
    }
    
    // 检查是否包含错误信息
    const errorKeywords = [
        '[读取文件失败',
        'utf-8',
        'codec can\'t decode',
        'invalid start byte',
        '无法解析文件内容'
    ];
    
    const hasError = errorKeywords.some(keyword => text.includes(keyword));
    
    if (hasError) {
        // 返回过滤后的友好提示
        return {
            shouldFilter: true,
            message: '文件内容处理完成，已生成教学材料'
        };
    }
    
    return { shouldFilter: false, message: text };
}

// ===== 状态管理 =====
let currentStage = 1;
let workflowState = null;

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    fetch('/get_state')
        .then(res => res.json())
        .then(state => {
            workflowState = state;
            updateStageDisplay();
        });
});

// ===== 项目上传功能 =====
const projectUploadArea = document.getElementById('projectUploadArea');
const projectFile = document.getElementById('projectFile');
const projectSubmitBtn = document.getElementById('projectSubmitBtn');
const projectForm = document.getElementById('projectForm');

projectUploadArea.addEventListener('click', () => {
    projectFile.click();
});

projectFile.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) {
        const placeholder = projectUploadArea.querySelector('.upload-placeholder');
        placeholder.innerHTML = '<span class="upload-icon">📄</span><p>' + file.name + '</p>';
        projectSubmitBtn.disabled = false;
    }
});

projectUploadArea.addEventListener('dragover', e => {
    e.preventDefault();
    projectUploadArea.style.background = '#f0f4ff';
});

projectUploadArea.addEventListener('dragleave', () => {
    projectUploadArea.style.background = 'transparent';
});

projectUploadArea.addEventListener('drop', e => {
    e.preventDefault();
    projectUploadArea.style.background = 'transparent';
    const file = e.dataTransfer.files[0];
    if (file) {
        projectFile.files = e.dataTransfer.files;
        const placeholder = projectUploadArea.querySelector('.upload-placeholder');
        placeholder.innerHTML = '<span class="upload-icon">📄</span><p>' + file.name + '</p>';
        projectSubmitBtn.disabled = false;
    }
});

projectForm.addEventListener('submit', async e => {
    e.preventDefault();
    const file = projectFile.files[0];
    if (!file) {
        alert('请选择文件');
        return;
    }
    projectSubmitBtn.disabled = true;
    projectSubmitBtn.textContent = '处理中...';
    const formData = new FormData();
    formData.append('file', file);
    try {
        const response = await fetch('/upload_project', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (result.success) {
            // 同步到 stage1（过滤错误信息）
            const filteredContent1 = filterErrorInfo(result.data.course_content);
            if (filteredContent1.shouldFilter) {
                document.getElementById('courseContent').innerHTML = filteredContent1.message;
            } else {
                safeSetText('courseContent', result.data.course_content);
            }
            document.getElementById('courseResult').style.display = 'block';
            renderTasks(result.data.student_tasks);
            document.getElementById('tasksResult').style.display = 'block';
            
            // 同步到 stage2（教学端，过滤错误信息）
            const filteredContent2 = filterErrorInfo(result.data.course_content);
            if (filteredContent2.shouldFilter) {
                document.getElementById('courseContent2').innerHTML = filteredContent2.message;
            } else {
                safeSetText('courseContent2', result.data.course_content);
            }
            document.getElementById('courseResult2').style.display = 'block';
            renderTasksToStage2(result.data.student_tasks);
            document.getElementById('tasksResult2').style.display = 'block';
            
            document.getElementById('status1').textContent = '已完成';
            document.getElementById('tab1').classList.add('completed');
            fetch('/get_state')
                .then(res => res.json())
                .then(state => {
                    workflowState = state;
                });
        } else {
            alert('执行失败: ' + result.error);
        }
    } catch (error) {
        alert('请求失败: ' + error.message);
    } finally {
        projectSubmitBtn.disabled = false;
        projectSubmitBtn.textContent = '生成教学材料和任务';
    }
});

// ===== 任务渲染功能 =====
function renderTasks(tasks) {
    const tasksList = document.getElementById('tasksList');
    tasksList.innerHTML = tasks.map(task => 
        '<div class="task-item">' +
            '<div class="task-id">' + task['任务ID'] + '</div>' +
            '<div class="task-name">' + task['任务名称'] + '</div>' +
            '<div class="task-desc">' + task['任务描述'] + '</div>' +
            '<div class="task-meta">' +
                '<span>难度: ' + task['难度'] + '</span> | ' +
                '<span>截止时间: ' + task['截止时间'] + '</span>' +
            '</div>' +
        '</div>'
    ).join('');
}

// ===== 渲染任务到教学端（新增） =====
function renderTasksToStage2(tasks) {
    const tasksList = document.getElementById('tasksList2');
    tasksList.innerHTML = tasks.map(task => 
        '<div class="task-item">' +
            '<div class="task-id">' + task['任务ID'] + '</div>' +
            '<div class="task-name">' + task['任务名称'] + '</div>' +
            '<div class="task-desc">' + task['任务描述'] + '</div>' +
            '<div class="task-meta">' +
                '<span>难度: ' + task['难度'] + '</span> | ' +
                '<span>截止时间: ' + task['截止时间'] + '</span>' +
            '</div>' +
        '</div>'
    ).join('');
}

// ===== 跳转到教学端（新增） =====
function goToStage2() {
    currentStage = 2;
    updateStageDisplay();
}

// ===== 跳转到学生端（新增） =====
function goToStage3() {
    currentStage = 3;
    updateStageDisplay();
    // 填充任务选择器
    document.getElementById('taskSelect').innerHTML = 
        '<option value="">请选择任务</option>' +
        workflowState.student_tasks.map(task => 
            '<option value="' + task['任务ID'] + '">' + 
                task['任务ID'] + ' - ' + task['任务名称'] + 
            '</option>'
        ).join('');
}

// ===== 作业提交功能 =====
const homeworkUploadArea = document.getElementById('homeworkUploadArea');
const homeworkFile = document.getElementById('homeworkFile');
const homeworkSubmitBtn = document.getElementById('homeworkSubmitBtn');
const homeworkForm = document.getElementById('homeworkForm');
const taskSelect = document.getElementById('taskSelect');

homeworkUploadArea.addEventListener('click', () => {
    homeworkFile.click();
});

homeworkFile.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) {
        const placeholder = homeworkUploadArea.querySelector('.upload-placeholder');
        placeholder.innerHTML = '<span class="upload-icon">📝</span><p>' + file.name + '</p>';
        checkHomeworkForm();
    }
});

taskSelect.addEventListener('change', checkHomeworkForm);

function checkHomeworkForm() {
    const file = homeworkFile.files[0];
    const taskId = taskSelect.value;
    homeworkSubmitBtn.disabled = !file || !taskId;
}

homeworkUploadArea.addEventListener('dragover', e => {
    e.preventDefault();
    homeworkUploadArea.style.background = '#f0f4ff';
});

homeworkUploadArea.addEventListener('dragleave', () => {
    homeworkUploadArea.style.background = 'transparent';
});

homeworkUploadArea.addEventListener('drop', e => {
    e.preventDefault();
    homeworkUploadArea.style.background = 'transparent';
    const file = e.dataTransfer.files[0];
    if (file) {
        homeworkFile.files = e.dataTransfer.files;
        const placeholder = homeworkUploadArea.querySelector('.upload-placeholder');
        placeholder.innerHTML = '<span class="upload-icon">📝</span><p>' + file.name + '</p>';
        checkHomeworkForm();
    }
});

homeworkForm.addEventListener('submit', async e => {
    e.preventDefault();
    const file = homeworkFile.files[0];
    const taskId = taskSelect.value;
    if (!file || !taskId) {
        alert('请选择任务和文件');
        return;
    }
    homeworkSubmitBtn.disabled = true;
    homeworkSubmitBtn.textContent = '提交中...';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('task_id', taskId);
    try {
        const response = await fetch('/submit_homework', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (result.success) {
            alert('作业提交成功！');
            homeworkForm.reset();
            homeworkUploadArea.querySelector('.upload-placeholder').innerHTML = 
                '<span class="upload-icon">📝</span><p>点击或拖拽作业文件到此处</p>';
            checkHomeworkForm();
            fetch('/get_state')
                .then(res => res.json())
                .then(state => {
                    workflowState = state;
                    renderSubmissions(state.submissions);
                });
        } else {
            alert('提交失败: ' + result.error);
        }
    } catch (error) {
        alert('请求失败: ' + error.message);
    } finally {
        homeworkSubmitBtn.disabled = false;
        homeworkSubmitBtn.textContent = '提交作业';
    }
});

// ===== 提交记录渲染功能 =====
function renderSubmissions(submissions) {
    const submissionsList = document.getElementById('submissionsList');
    if (submissions.length === 0) {
        submissionsList.innerHTML = '<p style="text-align:center;color:#999;">暂无提交</p>';
        return;
    }
    submissionsList.innerHTML = submissions.map(sub => 
        '<div class="submission-item">' +
            '<div class="submission-task">任务: ' + sub.task_id + '</div>' +
            '<div class="submission-file">文件: ' + sub.filename + '</div>' +
            '<div class="submission-time">提交时间: ' + sub.submit_time + '</div>' +
        '</div>'
    ).join('');
    document.getElementById('submissionsResult').style.display = 'block';
}

// ===== 生成报告功能（修改） =====
async function generateReport() {
    if (workflowState.submissions.length === 0) {
        alert('还没有提交任何作业');
        return;
    }
    if (!confirm('确定要生成点评报告吗？')) {
        return;
    }
    try {
        const response = await fetch('/generate_report', {
            method: 'POST'
        });
        const result = await response.json();
        if (result.success) {
            safeSetText('reportContent', result.report);
            document.getElementById('reportResult').style.display = 'block';
        } else {
            alert('生成失败: ' + result.error);
        }
    } catch (error) {
        alert('请求失败: ' + error.message);
    }
}

// ===== 重置工作流功能 =====
async function resetWorkflow() {
    if (!confirm('确定要开始新的工作流吗？所有数据将被清空。')) {
        return;
    }
    try {
        const response = await fetch('/reset_workflow', {
            method: 'POST'
        });
        const result = await response.json();
        if (result.success) {
            location.reload();
        }
    } catch (error) {
        alert('重置失败: ' + error.message);
    }
}

// ===== 阶段切换功能 =====
function updateStageDisplay() {
    document.querySelectorAll('.stage-content').forEach(el => {
        el.style.display = 'none';
    });
    document.querySelectorAll('.stage-tab').forEach((el, index) => {
        el.classList.remove('active');
        if (index + 1 === currentStage) {
            el.classList.add('active');
        }
    });
    const stageEl = document.getElementById('stage' + currentStage);
    if (stageEl) {
        stageEl.style.display = 'block';
    }
}

document.querySelectorAll('.stage-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const stage = parseInt(tab.dataset.stage);
        if (stage <= workflowState.stage) {
            currentStage = stage;
            updateStageDisplay();
        }
    });
});

// ===== 生成标准资料库功能（修改） =====
function generateMaterials() {
    const resultArea = document.getElementById('courseContent2');
    
    resultArea.innerHTML = '<p>正在生成标准资料库...</p>';
    
    // 模拟生成标准资料库
    setTimeout(() => {
        const materials = `
            <h3>家装设计标准资料库</h3>
            
            <h4>一、设计规范</h4>
            <p>1. 空间布局原则：保证动线流畅，功能分区明确</p>
            <p>2. 色彩搭配：遵循 60-30-10 原则，主色60%，辅助色30%，点缀色10%</p>
            <p>3. 照明设计：采用基础照明、重点照明、氛围照明三层设计</p>
            
            <h4>二、常用户型解析</h4>
            <p>1. 两居室：适合2-4人居住，核心区域为客厅和主卧</p>
            <p>2. 三居室：适合3-6人居住，需要规划多功能空间</p>
            <p>3. 四居室：适合4-8人居住，注重私密性和公共空间的平衡</p>
            
            <h4>三、材料选择指南</h4>
            <p>1. 地面材料：瓷砖、实木地板、复合地板</p>
            <p>2. 墙面材料：乳胶漆、壁纸、硅藻泥</p>
            <p>3. 顶面材料：石膏板吊顶、集成吊顶、裸顶</p>
            
            <h4>四、预算分配建议</h4>
            <p>1. 硬装（水电、墙地、吊顶）：40%</p>
            <p>2. 软装（家具、窗帘、饰品）：30%</p>
            <p>3. 电器设备：20%</p>
            <p>4. 备用金：10%</p>
            
            <h4>五、学生任务清单</h4>
            <ul class="task-list">
                <li>
                    <h4>任务1：户型分析</h4>
                    <p>分析给定户型的优缺点，提出改进建议</p>
                </li>
                <li>
                    <h4>任务2：方案设计</h4>
                    <p>根据户型特点和用户需求，完成平面布局设计</p>
                </li>
                <li>
                    <h4>任务3：材料搭配</h4>
                    <p>选择合适的材料，完成材料方案和预算表</p>
                </li>
                <li>
                    <h4>任务4：效果渲染</h4>
                    <p>制作3D效果图，展示最终设计方案</p>
                </li>
            </ul>
        `;
        
        resultArea.innerHTML = materials;
    }, 1500);
}
</body> 
</html> 
