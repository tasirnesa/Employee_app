// Deprecated — criteria are managed via /criteria/view and /criteria/create
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function CriteriaManagement() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/criteria/view', { replace: true }); }, [navigate]);
  return null;
}

export default CriteriaManagement;
