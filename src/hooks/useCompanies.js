import { useEffect, useState } from 'react';

export function useCompanies(code) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/companies/${code}`)
      .then(res => {
        if (!res.ok) throw new Error('Falha ao buscar empresas');
        return res.json();
      })
      .then(data => {
        setCompanies(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao buscar empresas:', err);
        setErro('Não foi possível carregar as empresas. Tente recarregar a página.');
        setLoading(false);
      });
  }, [code]);

  return { companies, loading, erro };
}