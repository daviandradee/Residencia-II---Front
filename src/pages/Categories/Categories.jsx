import React, { useState, useEffect } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/categoryService';
import './Categories.css';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [inputName, setInputName] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  // Delete confirm
  const [deletingId, setDeletingId] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditingId(null);
    setInputName('');
    setModalError('');
    setModalOpen(true);
  }

  function openEdit(cat) {
    setEditingId(cat.id);
    setInputName(cat.name);
    setModalError('');
    setModalOpen(true);
  }

  async function handleSave() {
    if (!inputName.trim()) { setModalError('Nome não pode ser vazio.'); return; }
    setSaving(true);
    setModalError('');
    try {
      if (editingId) {
        await updateCategory(editingId, inputName.trim());
      } else {
        await createCategory(inputName.trim());
      }
      setModalOpen(false);
      load();
    } catch (e) {
      setModalError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteCategory(id);
      setDeletingId(null);
      load();
    } catch (e) {
      setError(e.message);
      setDeletingId(null);
    }
  }

  return (
    <div className="categories-page">
      <div className="categories-container">
        <div className="categories-header">
          <div>
            <h1>Categorias</h1>
            <p>Gerencie as categorias de perguntas do quiz</p>
          </div>
          <button className="btn-primary" onClick={openCreate}>
            + Nova Categoria
          </button>
        </div>

        {error && <div className="categories-error">{error}</div>}

        {loading ? (
          <div className="categories-loading">
            <div className="spinner" />
            <span>Carregando...</span>
          </div>
        ) : (
          <div className="categories-grid">
            {categories.length === 0 ? (
              <div className="categories-empty">Nenhuma categoria cadastrada.</div>
            ) : (
              categories.map(cat => (
                <div key={cat.id} className="category-card">
                  <div className="category-card-info">
                    <span className="category-name">{cat.name}</span>
                    <span className="category-count">
                      {cat._count?.questions ?? 0} pergunta{(cat._count?.questions ?? 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="category-card-actions">
                    <button className="btn-edit" onClick={() => openEdit(cat)}>Editar</button>
                    <button
                      className="btn-delete"
                      onClick={() => setDeletingId(cat.id)}
                      disabled={(cat._count?.questions ?? 0) > 0}
                      title={(cat._count?.questions ?? 0) > 0 ? 'Possui perguntas vinculadas' : 'Excluir'}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal criar/editar */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2>{editingId ? 'Editar Categoria' : 'Nova Categoria'}</h2>
            <input
              className="modal-input"
              type="text"
              placeholder="Nome da categoria"
              value={inputName}
              onChange={e => setInputName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            {modalError && <p className="modal-error">{modalError}</p>}
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar exclusão */}
      {deletingId && (
        <div className="modal-overlay" onClick={() => setDeletingId(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2>Confirmar exclusão</h2>
            <p>Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeletingId(null)}>Cancelar</button>
              <button className="btn-danger" onClick={() => handleDelete(deletingId)}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
