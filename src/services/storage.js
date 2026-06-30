const memoryStorage = {};

const safeStorage = {
  getItem(key) {
    // Fallback para ler da URL caso localStorage esteja bloqueado e a página recarregada
    if (key === 'facilitadorToken') {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token') || urlParams.get('facilitatorToken');
      if (token) {
        memoryStorage[key] = token;
        return token;
      }
    }
    if (key === 'companyId') {
      const urlParams = new URLSearchParams(window.location.search);
      const cid = urlParams.get('companyId') || urlParams.get('companyID');
      if (cid) {
        memoryStorage[key] = cid;
        return cid;
      }
    }

    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      console.warn(`[Storage] Erro ao ler key "${key}" do localStorage. Usando fallback em memória.`, e.message);
      return memoryStorage[key] || null;
    }
  },
  setItem(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[Storage] Erro ao salvar key "${key}" no localStorage. Usando fallback em memória.`, e.message);
      memoryStorage[key] = String(value);
    }
  },
  removeItem(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[Storage] Erro ao remover key "${key}" do localStorage.`, e.message);
      delete memoryStorage[key];
    }
  },
  clear() {
    try {
      window.localStorage.clear();
    } catch (e) {
      console.warn('[Storage] Erro ao limpar localStorage.', e.message);
      for (const prop in memoryStorage) {
        delete memoryStorage[prop];
      }
    }
  }
};

export default safeStorage;
