// Deprecated — evaluations are managed via /evaluations/view and /evaluations/create
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const EvaluationForm: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => { navigate('/evaluations/view', { replace: true }); }, [navigate]);
  return null;
};

export default EvaluationForm;
