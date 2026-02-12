const AUTHOR = "Синишин Виталий (vitas-0071@yandex.ru)";
const LICENSE = "Проприетарная лицензия. Использование только с разрешения автора.";
 // Инициализация стандартных длин
        const defaultLengths = [5.85, 6, 11.7, 12];
        let selectedLengths = [];
        let results = [];
        
        // Инициализация страницы
        document.addEventListener('DOMContentLoaded', function() {
            renderLengthOptions();
        });
        
        // Отображение опций длин
        function renderLengthOptions() {
            const container = document.getElementById('lengthOptions');
            container.innerHTML = '';
            
            defaultLengths.forEach(length => {
                const option = document.createElement('div');
                option.className = 'length-option';
                option.innerHTML = `
                    <input type="checkbox" id="length-${length}" value="${length}" 
                           ${selectedLengths.includes(length) ? 'checked' : ''}>
                    <label for="length-${length}">${length}м</label>
                `;
                container.appendChild(option);
            });
            
            // Добавляем обработчики событий
            container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    const value = parseFloat(this.value);
                    if (this.checked && !selectedLengths.includes(value)) {
                        selectedLengths.push(value);
                    } else {
                        selectedLengths = selectedLengths.filter(l => l !== value);
                    }
                });
            });
        }
        
        // Добавление пользовательской длины
        function addCustomLength() {
            const customLengthInput = document.getElementById('customLength');
            const length = parseFloat(customLengthInput.value.replace(',', '.'));
            
            if (isNaN(length) || length <= 0) {
                alert('Пожалуйста, введите корректную длину');
                return;
            }
            
            if (!defaultLengths.includes(length)) {
                defaultLengths.push(length);
                selectedLengths.push(length);
                renderLengthOptions();
            }
            
            customLengthInput.value = '';
        }
        
        // Добавление поля для ввода требуемого размера
        function addLengthInput() {
            const container = document.getElementById('lengthInputs');
            const div = document.createElement('div');
            div.className = 'length-input';
            div.innerHTML = `
                <input type="number" step="0.01" class="required-length" placeholder="Длина (м)">
                <input type="number" class="required-quantity" placeholder="Количество">
                <button onclick="removeLengthInput(this)">×</button>
            `;
            container.appendChild(div);
        }
        
        // Удаление поля для ввода требуемого размера
        function removeLengthInput(button) {
            const container = document.getElementById('lengthInputs');
            if (container.children.length > 1) {
                button.parentElement.remove();
            } else {
                const inputs = button.parentElement.querySelectorAll('input');
                inputs.forEach(input => input.value = '');
            }
        }
        
        // Функция подсчета количества резов и отрезков
        function calculateSummary(plans, requiredPieces) {
            // Считаем общее количество резов
            let totalCuts = 0;
            plans.forEach(plan => {
                totalCuts += plan.cutsCount * plan.count;
            });
            
            // Считаем количество полученных отрезков каждого размера
            const cutsSummary = {};
            plans.forEach(plan => {
                plan.cuts.forEach(cutLength => {
                    if (!cutsSummary[cutLength]) {
                        cutsSummary[cutLength] = 0;
                    }
                    cutsSummary[cutLength] += plan.count;
                });
            });
            
            // Считаем остатки
            const remainsSummary = {};
            plans.forEach(plan => {
                if (plan.remaining > 0.01) {
                    if (!remainsSummary[plan.remaining]) {
                        remainsSummary[plan.remaining] = 0;
                    }
                    remainsSummary[plan.remaining] += plan.count;
                }
            });
            
            return { totalCuts, cutsSummary, remainsSummary };
        }
        
        // Основная функция расчета
        function calculate() {
            const productName = document.getElementById('productName').value.trim();
            
            if (!productName) {
                alert('Введите название товара');
                return;
            }
            
            if (selectedLengths.length === 0) {
                alert('Выберите хотя бы одну длину изделия');
                return;
            }
            
            // Получаем требуемые размеры
            const requiredPieces = [];
            const inputs = document.getElementById('lengthInputs').querySelectorAll('.length-input');
            
            inputs.forEach(input => {
                const lengthInput = input.querySelector('.required-length');
                const quantityInput = input.querySelector('.required-quantity');
                
                const length = parseFloat(lengthInput.value.replace(',', '.'));
                const quantity = parseInt(quantityInput.value);
                
                if (!isNaN(length) && length > 0 && !isNaN(quantity) && quantity > 0) {
                    requiredPieces.push({ length, quantity });
                }
            });
            
            if (requiredPieces.length === 0) {
                alert('Введите хотя бы один требуемый размер и количество');
                return;
            }
            
            // Сортируем длины по убыванию для более эффективного распределения
            selectedLengths.sort((a, b) => b - a);
            
            // Копируем массив требуемых деталей для работы
            let piecesToCut = [];
            requiredPieces.forEach(piece => {
                for (let i = 0; i < piece.quantity; i++) {
                    piecesToCut.push(piece.length);
                }
            });
            piecesToCut.sort((a, b) => b - a);
            
            // Алгоритм First-Fit Decreasing для упаковки
            const cuttingPlans = [];
            
            while (piecesToCut.length > 0) {
                let bestFit = null;
                let bestFitRemaining = Infinity;
                let bestFitIndex = -1;
                
                // Ищем оптимальную длину для текущей детали
                for (let i = 0; i < selectedLengths.length; i++) {
                    const stockLength = selectedLengths[i];
                    
                    if (piecesToCut[0] > stockLength) continue;
                    
                    const remaining = stockLength - piecesToCut[0];
                    
                    if (remaining < bestFitRemaining) {
                        bestFitRemaining = remaining;
                        bestFit = stockLength;
                        bestFitIndex = i;
                    }
                }
                
                if (bestFit === null) {
                    alert(`Невозможно выполнить резку: деталь ${piecesToCut[0]}м больше всех доступных длин`);
                    return;
                }
                
                // Создаем новый план резки
                const newPlan = {
                    stockLength: bestFit,
                    cuts: [piecesToCut[0]],
                    remaining: bestFit - piecesToCut[0],
                    cutsCount: 1
                };
                
                piecesToCut.shift();
                
                // Пытаемся добавить другие детали в этот же план
                for (let i = 0; i < piecesToCut.length; i++) {
                    if (piecesToCut[i] <= newPlan.remaining) {
                        newPlan.cuts.push(piecesToCut[i]);
                        newPlan.remaining -= piecesToCut[i];
                        newPlan.cutsCount++;
                        piecesToCut.splice(i, 1);
                        i--;
                    }
                }
                
                cuttingPlans.push(newPlan);
            }
            
            // Группируем одинаковые планы резки
            const groupedPlans = {};
            cuttingPlans.forEach(plan => {
                const key = `${plan.stockLength}-${plan.cuts.join(',')}`;
                if (!groupedPlans[key]) {
                    groupedPlans[key] = {
                        stockLength: plan.stockLength,
                        cuts: plan.cuts,
                        remaining: plan.remaining,
                        cutsCount: plan.cutsCount,
                        count: 0
                    };
                }
                groupedPlans[key].count++;
            });
            
            // Получаем сводные данные
            const plansArray = Object.values(groupedPlans);
            const summary = calculateSummary(plansArray, requiredPieces);
            
            // Сохраняем результат
            const result = {
                productName,
                plans: plansArray,
                summary: summary,
                requiredPieces: requiredPieces
            };
            
            results.push(result);
            renderResults();
            document.getElementById('printBtn').disabled = false;
        }
        
        // Отображение результатов
        function renderResults() {
            const container = document.getElementById('results');
            container.innerHTML = '';
            
            if (results.length === 0) {
                container.innerHTML = '<p>Нет результатов для отображения</p>';
                document.getElementById('printBtn').disabled = true;
                return;
            }
            
            results.forEach((result, resultIndex) => {
                const resultDiv = document.createElement('div');
                resultDiv.className = 'result-item';
                
                let html = `
                    <div class="result-header">${result.productName}</div>
                    <div class="result-details">
                `;
                
                result.plans.forEach((plan, planIndex) => {
                    html += `
                        <div>
                            ${plan.count} штук${getPluralEnding(plan.count)} по ${plan.stockLength}м с резкой: 
                            ${plan.cuts.join('м + ')}м + остаток ${plan.remaining.toFixed(2)}м (${plan.cutsCount} резов)
                        </div>
                    `;
                });
                
                // Добавляем сводку
                html += `<div class="result-summary">`;
                html += `<strong>ИТОГО:</strong><div class="cuts-list">`;
                
                // Сортируем отрезки по длине
                const sortedCuts = Object.keys(result.summary.cutsSummary)
                    .sort((a, b) => parseFloat(b) - parseFloat(a));
                
                sortedCuts.forEach(length => {
                    html += `<div>по ${parseFloat(length).toFixed(2)}м - ${result.summary.cutsSummary[length]} шт.</div>`;
                });
                
                // Добавляем остатки
                if (Object.keys(result.summary.remainsSummary).length > 0) {
                    const sortedRemains = Object.keys(result.summary.remainsSummary)
                        .sort((a, b) => parseFloat(b) - parseFloat(a));
                    
                    sortedRemains.forEach(length => {
                        html += `<div>по ${parseFloat(length).toFixed(2)}м - ${result.summary.remainsSummary[length]} шт. (остатки)</div>`;
                    });
                }
                
                html += `</div>`;
                html += `<div class="total-cuts">Общее количество резов "${result.productName}": ${result.summary.totalCuts} резов</div>`;
                html += `</div>`;
                html += `</div>`;
                
                html += `<button class="delete-btn" onclick="deleteResult(${resultIndex})">Удалить</button>`;
                
                resultDiv.innerHTML = html;
                container.appendChild(resultDiv);
            });
        }
        
        // Удаление результата
        function deleteResult(index) {
            results.splice(index, 1);
            renderResults();
            if (results.length === 0) {
                document.getElementById('printBtn').disabled = true;
            }
        }

        // Функция печати результатов
        function printResults() {
            if (results.length === 0) {
                alert('Нет данных для печати');
                return;
            }

            const printSection = document.getElementById('printSection');
            printSection.innerHTML = '';
            
            // Создаем заголовок
            const header = document.createElement('div');
            header.className = 'print-header';
            header.innerHTML = `
                <div class="print-title">Карта резки металлопроката</div>
                <div class="print-date">Дата: ${new Date().toLocaleDateString('ru-RU')}</div>
            `;
            printSection.appendChild(header);
            
            // Добавляем результаты
            results.forEach(result => {
                const item = document.createElement('div');
                item.className = 'print-item';
                
                const product = document.createElement('div');
                product.className = 'print-product';
                product.textContent = `Товар: ${result.productName}`;
                item.appendChild(product);
                
                result.plans.forEach(plan => {
                    const planDiv = document.createElement('div');
                    planDiv.className = 'print-plan';
                    planDiv.textContent = 
                        `${plan.count} штук${getPluralEnding(plan.count)} по ${plan.stockLength}м: ` +
                        `${plan.cuts.join('м + ')}м + остаток ${plan.remaining.toFixed(2)}м (${plan.cutsCount} резов)`;
                    item.appendChild(planDiv);
                });
                
                // Добавляем сводку в печатную версию
                const summaryDiv = document.createElement('div');
                summaryDiv.className = 'print-summary';
                
                let summaryHtml = `<strong>ИТОГО:</strong><div class="print-cuts-list">`;
                
                const sortedCuts = Object.keys(result.summary.cutsSummary)
                    .sort((a, b) => parseFloat(b) - parseFloat(a));
                
                sortedCuts.forEach(length => {
                    summaryHtml += `<div>по ${parseFloat(length).toFixed(2)}м - ${result.summary.cutsSummary[length]} шт.</div>`;
                });
                
                if (Object.keys(result.summary.remainsSummary).length > 0) {
                    const sortedRemains = Object.keys(result.summary.remainsSummary)
                        .sort((a, b) => parseFloat(b) - parseFloat(a));
                    
                    sortedRemains.forEach(length => {
                        summaryHtml += `<div>по ${parseFloat(length).toFixed(2)}м - ${result.summary.remainsSummary[length]} шт. (остатки)</div>`;
                    });
                }
                
                summaryHtml += `</div>`;
                summaryHtml += `<div class="print-total-cuts">Общее количество резов "${result.productName}": ${result.summary.totalCuts} резов</div>`;
                
                summaryDiv.innerHTML = summaryHtml;
                item.appendChild(summaryDiv);
                
                printSection.appendChild(item);
            });
            
            // Временно показываем секцию перед печатью
            printSection.style.display = 'block';
            
            // Инициируем печать
            window.print();
            
            // После печати снова скрываем
            setTimeout(() => {
                printSection.style.display = 'none';
            }, 1000);
        }
        
        // Вспомогательная функция для склонения слова "штука"
        function getPluralEnding(number) {
            if (number % 10 === 1 && number % 100 !== 11) {
                return 'а';
            } else if ([2, 3, 4].includes(number % 10) && ![12, 13, 14].includes(number % 100)) {
                return 'и';
            } else {
                return '';
            }
        }

        


