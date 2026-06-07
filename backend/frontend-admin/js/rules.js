// js/rules.js

document.addEventListener('DOMContentLoaded', () => {
    
    const container = document.getElementById('rulesContainer');
    
    const catModal = document.getElementById('catModal');
    const catForm = document.getElementById('catForm');
    const catModalTitle = document.getElementById('catModalTitle');
    
    const ruleModal = document.getElementById('ruleModal');
    const ruleForm = document.getElementById('ruleForm');
    const ruleModalTitle = document.getElementById('ruleModalTitle');

    // Load Data
    async function loadRules() {
        container.innerHTML = '<p style="text-align:center;">Loading rules...</p>';
        try {
            const data = await fetchAuth('/rules/categories/');
            container.innerHTML = '';
            
            if (data.length === 0) {
                container.innerHTML = '<p style="text-align:center; color: var(--text-muted)">No rule categories found.</p>';
                return;
            }

            data.forEach(cat => {
                const catCard = document.createElement('div');
                catCard.className = 'category-card';
                
                let rulesHtml = '<ul class="rule-list">';
                cat.rules.forEach(r => {
                    rulesHtml += `
                        <li class="rule-item" data-id="${r.id}">
                            <div style="cursor: grab; color: var(--text-muted); display:flex; align-items:center;" class="drag-handle">
                                <ion-icon name="reorder-two-outline" style="font-size: 1.5rem;"></ion-icon>
                            </div>
                            <div class="rule-text" style="flex: 1;">${r.description}</div>
                            <div style="display:flex; gap: 0.5rem; flex-shrink: 0;">
                                <button class="btn-icon" onclick='editRule(${JSON.stringify(r).replace(/'/g, "&apos;")})'>
                                    <ion-icon name="create-outline"></ion-icon>
                                </button>
                                <button class="btn-icon" style="color: var(--danger-color);" onclick="deleteRule(${r.id})">
                                    <ion-icon name="trash-outline"></ion-icon>
                                </button>
                            </div>
                        </li>
                    `;
                });
                rulesHtml += '</ul>';

                if (cat.rules.length === 0) {
                    rulesHtml = '<p style="padding: 1rem 1.5rem; color: var(--text-muted); margin: 0;">No rules in this category yet.</p>';
                }

                catCard.innerHTML = `
                    <div class="category-header">
                        <h4><ion-icon name="folder-open-outline"></ion-icon> ${cat.name}</h4>
                        <div style="display:flex; gap: 0.5rem;">
                            <button class="btn-secondary" style="padding: 0.4rem 0.8rem;" onclick='editCategory(${JSON.stringify(cat).replace(/'/g, "&apos;")})'>
                                <ion-icon name="create-outline"></ion-icon> Edit Name
                            </button>
                            <button class="btn-danger" style="padding: 0.4rem 0.8rem;" onclick="deleteCategory(${cat.id})">
                                <ion-icon name="trash-outline"></ion-icon> Delete Category
                            </button>
                        </div>
                    </div>
                    ${rulesHtml}
                    <div class="add-rule-row">
                        <button class="btn-secondary" style="color: var(--accent-color); border-color: var(--accent-color);" onclick="addRule(${cat.id})">
                            <ion-icon name="add-outline"></ion-icon> Add Rule to this Category
                        </button>
                    </div>
                `;
                container.appendChild(catCard);
            });

            // Initialize Sortable for each rule list
            document.querySelectorAll('.rule-list').forEach(list => {
                Sortable.create(list, {
                    handle: '.drag-handle',
                    animation: 150,
                    onEnd: async function () {
                        const items = Array.from(list.querySelectorAll('li.rule-item[data-id]'));
                        const newOrder = items.map(li => parseInt(li.getAttribute('data-id')));
                        try {
                            await fetchAuth('/rules/items/reorder', {
                                method: 'POST',
                                body: JSON.stringify({ item_ids: newOrder })
                            });
                            showToast("Order saved successfully!", "success");
                        } catch(err) {
                            showToast("Failed to save order", "error");
                            loadRules(); // reload to reset
                        }
                    }
                });
            });

        } catch (err) {
            container.innerHTML = '<p style="text-align:center; color: var(--danger-color)">Error loading data.</p>';
        }
    }

    // --- Category Logic ---
    document.getElementById('addCategoryBtn').addEventListener('click', () => {
        catForm.reset();
        document.getElementById('catId').value = '';
        catModalTitle.textContent = "Add Category";
        catModal.classList.add('active');
    });

    document.getElementById('closeCatModal').addEventListener('click', () => catModal.classList.remove('active'));

    window.editCategory = function(catData) {
        catForm.reset();
        document.getElementById('catId').value = catData.id;
        document.getElementById('catName').value = catData.name;
        catModalTitle.textContent = "Edit Category Name";
        catModal.classList.add('active');
    };

    window.deleteCategory = async function(id) {
        if (!confirm("Delete this category and ALL rules inside it?")) return;
        try {
            await fetchAuth(`/rules/categories/${id}`, { method: 'DELETE' });
            showToast("Category deleted", "success");
            loadRules();
        } catch(err) {
            showToast(err.message, "error");
        }
    };

    catForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = catForm.querySelector('button[type="submit"]');
        btn.innerHTML = '<ion-icon name="sync-outline" class="spin"></ion-icon> Saving...';
        
        const id = document.getElementById('catId').value;
        const payload = { name: document.getElementById('catName').value };

        try {
            if (id) {
                await fetchAuth(`/rules/categories/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
                showToast("Category updated!", "success");
            } else {
                await fetchAuth(`/rules/categories/`, { method: 'POST', body: JSON.stringify(payload) });
                showToast("Category created!", "success");
            }
            catModal.classList.remove('active');
            loadRules();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            btn.innerHTML = '<ion-icon name="save-outline"></ion-icon> Save Category';
        }
    });

    // --- Rule Item Logic ---
    window.addRule = function(categoryId) {
        ruleForm.reset();
        document.getElementById('ruleId').value = '';
        document.getElementById('ruleCategoryId').value = categoryId;
        ruleModalTitle.textContent = "Add Rule";
        ruleModal.classList.add('active');
    };

    document.getElementById('closeRuleModal').addEventListener('click', () => ruleModal.classList.remove('active'));

    window.editRule = function(ruleData) {
        ruleForm.reset();
        document.getElementById('ruleId').value = ruleData.id;
        document.getElementById('ruleCategoryId').value = ruleData.category_id;
        document.getElementById('ruleDescription').value = ruleData.description;
        ruleModalTitle.textContent = "Edit Rule";
        ruleModal.classList.add('active');
    };

    window.deleteRule = async function(id) {
        if (!confirm("Delete this rule?")) return;
        try {
            await fetchAuth(`/rules/items/${id}`, { method: 'DELETE' });
            showToast("Rule deleted", "success");
            loadRules();
        } catch(err) {
            showToast(err.message, "error");
        }
    };

    ruleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = ruleForm.querySelector('button[type="submit"]');
        btn.innerHTML = '<ion-icon name="sync-outline" class="spin"></ion-icon> Saving...';
        
        const id = document.getElementById('ruleId').value;
        const payload = { 
            description: document.getElementById('ruleDescription').value,
            category_id: parseInt(document.getElementById('ruleCategoryId').value)
        };

        try {
            if (id) {
                // PATCH doesn't need category_id, just description
                await fetchAuth(`/rules/items/${id}`, { 
                    method: 'PATCH', 
                    body: JSON.stringify({ description: payload.description }) 
                });
                showToast("Rule updated!", "success");
            } else {
                await fetchAuth(`/rules/items/`, { method: 'POST', body: JSON.stringify(payload) });
                showToast("Rule created!", "success");
            }
            ruleModal.classList.remove('active');
            loadRules();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            btn.innerHTML = '<ion-icon name="save-outline"></ion-icon> Save Rule';
        }
    });

    // Initial load
    loadRules();
});
