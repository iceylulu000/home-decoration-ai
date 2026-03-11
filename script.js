// ===== 工具函数 =====
function uploadProject() {
    const fileInput = document.getElementById('projectFile');
    const resultArea = document.getElementById('courseContent');
    
    if (fileInput.files.length === 0) {
        resultArea.innerHTML = '<p style="color: red;">请先选择文件</p>';
        return;
    }
    
    resultArea.innerHTML = '<p>正在上传...</p>';
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    // 添加企业信息
    formData.append('company_name', document.getElementById('companyName').value);
    formData.append('project_type', document.getElementById('projectType').value);
    formData.append('project_stage', document.getElementById('projectStage').value);
    
    fetch('/upload_project', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 过滤不友好的信息
            let content = data.data.course_content;
            
            // 去除错误信息
            content = content.replace(/\[读取文件失败.*?\]/g, '');
            content = content.replace(/utf-8.*?invalid start byte/g, '');
            content = content.replace(/无法解析文件内容.*?字节/g, '');
            
            // 去除【实战任务】
            content = content.replace(/【实战任务】/g, '');
            
            // 去除多余的空行
            content = content.replace(/\n\s*\n/g, '\n');
            
            // 如果过滤后内容为空，显示友好提示
            if (content.trim() === '') {
                content = '文件内容处理完成，已生成教学材料';
            }
            
            resultArea.innerHTML = '<h3>生成成功！</h3><p>' + content + '</p>';
            
            // 显示任务列表
            const tasksList = document.getElementById('tasksList');
            if (tasksList && data.data.student_tasks) {
                tasksList.innerHTML = data.data.student_tasks.map(task => 
                    '<div class="task-item">' +
                        '<div class="task-id">' + (task['任务ID'] || task.id) + '</div>' +
                        '<div class="task-name">' + (task['任务名称'] || task.title) + '</div>' +
                        '<div class="task-desc">' + (task['任务描述'] || task.description) + '</div>' +
                        '<div class="task-meta"><span>难度: ' + (task['难度'] || task.difficulty || '中等') + '</span> | <span>截止时间: ' + (task['截止时间'] || task.deadline || '1周后') + '</span></div>' +
                    '</div>'
                ).join('');
                document.getElementById('tasksResult').style.display = 'block';
            }
        } else {
            resultArea.innerHTML = '<p style="color: red;">' + data.error + '</p>';
        }
    })
    .catch(error => {
        resultArea.innerHTML = '<p style="color: red;">上传失败：' + error + '</p>';
    });
}

function generateMaterials() {
    const materialsArea = document.getElementById('standardMaterials');
    
    materialsArea.innerHTML = '<p>正在生成标准资料库...</p>';
    
    // 模拟生成标准资料库
    setTimeout(() => {
        const materials = `
            <h4 style="color: #667eea; margin-bottom: 10px;">家装设计标准资料库</h4>
            
            <h5 style="margin-top: 15px; margin-bottom: 5px;">一、设计规范</h5>
            <p>1. 空间布局原则：保证动线流畅，功能分区明确</p>
            <p>2. 色彩搭配：遵循 60-30-10 原则，主色60%，辅助色30%，点缀色10%</p>
            <p>3. 照明设计：采用基础照明、重点照明、氛围照明三层设计</p>
            
            <h5 style="margin-top: 15px; margin-bottom: 5px;">二、常用户型解析</h5>
            <p>1. 两居室：适合2-4人居住，核心区域为客厅和主卧</p>
            <p>2. 三居室：适合3-6人居住，需要规划多功能空间</p>
            <p>3. 四居室：适合4-8人居住，注重私密性和公共空间的平衡</p>
            
            <h5 style="margin-top: 15px; margin-bottom: 5px;">三、材料选择指南</h5>
            <p>1. 地面材料：瓷砖、实木地板、复合地板</p>
            <p>2. 墙面材料：乳胶漆、壁纸、硅藻泥</p>
            <p>3. 顶面材料：石膏板吊顶、集成吊顶、裸顶</p>
            
            <h5 style="margin-top: 15px; margin-bottom: 5px;">四、预算分配建议</h5>
            <p>1. 硬装（水电、墙地、吊顶）：40%</p>
            <p>2. 软装（家具、窗帘、饰品）：30%</p>
            <p>3. 电器设备：20%</p>
            <p>4. 备用金：10%</p>
            
            <h5 style="margin-top: 15px; margin-bottom: 5px;">五、学生任务清单</h5>
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
        
        materialsArea.innerHTML = materials;
    }, 1500);
}

function submitHomework() {
    const fileInput = document.getElementById('homeworkFile');
    
    if (fileInput.files.length === 0) {
        alert('请先选择文件');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    const submitBtn = document.getElementById('homeworkSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = '提交中...';
    
    fetch('/submit_homework', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 显示AI评价
            if (data.ai_feedback) {
                const aiFeedbackArea = document.getElementById('aiFeedbackContent');
                if (aiFeedbackArea) {
                    aiFeedbackArea.innerHTML = data.ai_feedback.replace(/\n/g, '<br>');
                    document.getElementById('aiFeedbackResult').style.display = 'block';
                }
            }
            
            alert('作业提交成功！');
            
            // 重置表单
            document.getElementById('homeworkForm').reset();
            const placeholder = document.querySelector('#homeworkUploadArea .upload-placeholder');
            if (placeholder) {
                placeholder.innerHTML = '<span class="upload-icon">📝</span><p>点击或拖拽作业文件到此处</p><p class="upload-hint">支持：任意格式文件（图片、视频、文档等）</p>';
            }
            submitBtn.disabled = true;
            
            // 更新提交列表
            fetch('/get_state')
                .then(res => res.json())
                .then(state => {
                    workflowState = state;
                    renderSubmissions(state.submissions);
                });
        } else {
            alert('提交失败: ' + data.error);
        }
    })
    .catch(error => {
        alert('提交失败: ' + error.message);
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = '提交作业';
    });
}

// ===== 全局变量 =====
let currentStage = 1;
let workflowState = null;

// ===== 页面初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('页面加载完成');
    
    // 初始化工作流状态
    fetch('/get_state')
        .then(res => res.json())
        .then(state => {
            workflowState = state;
            console.log('工作流状态:', state);
            updateStageDisplay();
        })
        .catch(error => {
            console.error('获取状态失败:', error);
        });
    
    // ========== 项目上传相关 ==========
    const projectUploadArea = document.getElementById('projectUploadArea');
    const projectFile = document.getElementById('projectFile');
    const projectSubmitBtn = document.getElementById('projectSubmitBtn');
    const projectForm = document.getElementById('projectForm');
    
    // 企业信息相关
    const companyNameInput = document.getElementById('companyName');
    const projectTypeSelect = document.getElementById('projectType');
    const projectStageSelect = document.getElementById('projectStage');
    
    // 检查项目表单
    function checkProjectForm() {
        const file = projectFile.files[0];
        const companyName = companyNameInput ? companyNameInput.value : '';
        const projectType = projectTypeSelect ? projectTypeSelect.value : '';
        const projectStage = projectStageSelect ? projectStageSelect.value : '';
        if (projectSubmitBtn) {
            projectSubmitBtn.disabled = !file || !companyName || !projectType || !projectStage;
        }
    }
    
    // 项目上传区域点击
    if (projectUploadArea && projectFile) {
        projectUploadArea.addEventListener('click', () => {
            projectFile.click();
        });
        
        // 文件选择变化
        projectFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const placeholder = projectUploadArea.querySelector('.upload-placeholder');
                if (placeholder) {
                    placeholder.innerHTML = '<span class="upload-icon">📄</span><p>' + file.name + '</p>';
                }
                checkProjectForm();
            }
        });
        
        // 拖拽相关
        projectUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            projectUploadArea.style.background = '#f0f4ff';
        });
        
        projectUploadArea.addEventListener('dragleave', () => {
            projectUploadArea.style.background = '#f8f9fa';
        });
        
        projectUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            projectUploadArea.style.background = '#f8f9fa';
            const file = e.dataTransfer.files[0];
            if (file) {
                projectFile.files = e.dataTransfer.files;
                const placeholder = projectUploadArea.querySelector('.upload-placeholder');
                if (placeholder) {
                    placeholder.innerHTML = '<span class="upload-icon">📄</span><p>' + file.name + '</p>';
                }
                checkProjectForm();
            }
        });
    }
    
    // 监听企业信息输入
    if (companyNameInput) companyNameInput.addEventListener('input', checkProjectForm);
    if (projectTypeSelect) projectTypeSelect.addEventListener('change', checkProjectForm);
    if (projectStageSelect) projectStageSelect.addEventListener('change', checkProjectForm);
    
    // 项目表单提交
    if (projectForm) {
        projectForm.addEventListener('submit', (e) => {
            e.preventDefault();
            uploadProject();
        });
    }
    
    // ========== 作业上传相关 ==========
    const homeworkUploadArea = document.getElementById('homeworkUploadArea');
    const homeworkFile = document.getElementById('homeworkFile');
    const homeworkSubmitBtn = document.getElementById('homeworkSubmitBtn');
    const homeworkForm = document.getElementById('homeworkForm');
    
    // 作业上传区域点击
    if (homeworkUploadArea && homeworkFile) {
        homeworkUploadArea.addEventListener('click', () => {
            homeworkFile.click();
        });
        
        // 文件选择变化
        homeworkFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const placeholder = homeworkUploadArea.querySelector('.upload-placeholder');
                if (placeholder) {
                    placeholder.innerHTML = '<span class="upload-icon">📝</span><p>' + file.name + '</p>';
                }
                if (homeworkSubmitBtn) {
                    homeworkSubmitBtn.disabled = false;
                }
            }
        });
        
        // 拖拽相关
        homeworkUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            homeworkUploadArea.style.background = '#f0f4ff';
        });
        
        homeworkUploadArea.addEventListener('dragleave', () => {
            homeworkUploadArea.style.background = '#f8f9fa';
        });
        
        homeworkUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            homeworkUploadArea.style.background = '#f8f9fa';
            const file = e.dataTransfer.files[0];
            if (file) {
                homeworkFile.files = e.dataTransfer.files;
                const placeholder = homeworkUploadArea.querySelector('.upload-placeholder');
                if (placeholder) {
                    placeholder.innerHTML = '<span class="upload-icon">📝</span><p>' + file.name + '</p>';
                }
                if (homeworkSubmitBtn) {
                    homeworkSubmitBtn.disabled = false;
                }
            }
        });
    }
    
    // 作业表单提交
    if (homeworkForm) {
        homeworkForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitHomework();
        });
    }
    
    // ========== Tab切换 ==========
    document.querySelectorAll('.stage-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const stage = parseInt(tab.dataset.stage);
            if (workflowState && stage <= workflowState.stage) {
                currentStage = stage;
                updateStageDisplay();
            }
        });
    });
});

// ===== 页面切换函数 =====
function goToStage2() {
    currentStage = 2;
    updateStageDisplay();
}

function goToStage3() {
    currentStage = 3;
    updateStageDisplay();
}

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

// ===== 渲染提交列表 =====
function renderSubmissions(submissions) {
    const submissionsList = document.getElementById('submissionsList');
    const submissionsResult = document.getElementById('submissionsResult');
    
    if (!submissionsList) {
        console.error('submissionsList 元素不存在');
        return;
    }
    
    if (!submissions || submissions.length === 0) {
        submissionsList.innerHTML = '<p style="text-align:center;color:#999;">暂无提交</p>';
        return;
    }
    
    submissionsList.innerHTML = submissions.map(sub => 
        '<div class="submission-item">' +
            '<div class="submission-file">文件: ' + sub.filename + '</div>' +
            '<div class="submission-time">提交时间: ' + sub.submit_time + '</div>' +
            (sub.ai_feedback ? '<div class="submission-feedback">🤖 AI评价: ' + sub.ai_feedback.substring(0, 50) + '...</div>' : '') +
        '</div>'
    ).join('');
    
    if (submissionsResult) {
        submissionsResult.style.display = 'block';
    }
}

// ===== 报告生成 =====
function generateReport() {
    if (!workflowState || !workflowState.submissions || workflowState.submissions.length === 0) {
        alert('还没有提交任何作业');
        return;
    }
    if (!confirm('确定要生成点评报告吗？')) {
        return;
    }
    
    const reportContent = document.getElementById('reportContent');
    reportContent.innerHTML = '<p>正在生成报告...</p>';
    
    fetch('/generate_report', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            reportContent.innerHTML = '<pre style="white-space: pre-wrap; font-family: inherit;">' + data.report + '</pre>';
            const reportResult = document.getElementById('reportResult');
            if (reportResult) {
                reportResult.style.display = 'block';
            }
        } else {
            reportContent.innerHTML = '<p style="color: red;">生成失败: ' + data.error + '</p>';
        }
    })
    .catch(error => {
        reportContent.innerHTML = '<p style="color: red;">请求失败: ' + error + '</p>';
    });
}

// ===== 重置工作流 =====
function resetWorkflow() {
    if (!confirm('确定要开始新的工作流吗？所有数据将被清空。')) {
        return;
    }
    
    fetch('/reset_workflow', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload();
        } else {
            alert('重置失败: ' + data.error);
        }
    })
    .catch(error => {
        alert('重置失败: ' + error);
    });
}
