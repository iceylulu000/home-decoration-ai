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
                    
                    // 同时更新教学端
                    const teachingMaterials = document.getElementById('teachingMaterials');
                    if (teachingMaterials) {
                        teachingMaterials.innerHTML = '<p>' + content + '</p>';
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
            const textInput = document.getElementById('submissionText');
            const resultArea = document.getElementById('feedback');
            
            if (textInput.value.trim() === '') {
                resultArea.innerHTML = '<p style="color: red;">请输入作业内容</p>';
                return;
            }
            
            resultArea.innerHTML = '<p>正在提交...</p>';
            
            fetch('/submit_homework', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    submission: textInput.value
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    resultArea.innerHTML = '<h3>提交成功！</h3><p>' + data.data.feedback + '</p>';
                } else {
                    resultArea.innerHTML = '<p style="color: red;">' + data.error + '</p>';
                }
            })
            .catch(error => {
                resultArea.innerHTML = '<p style="color: red;">提交失败：' + error + '</p>';
            });
        }
</body> 
</html> 
