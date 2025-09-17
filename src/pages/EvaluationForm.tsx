import React, { useEffect, useState } from 'react';
import axios from 'axios';
import type { Evaluation } from '../types/index.ts'; // Ensure correct path

const EvaluationForm: React.FC = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3000/api/evaluations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEvaluations(response.data);
      } catch (err: any) {
        console.error('Fetch evaluations error:', err);
        setError('Failed to load evaluations');
      }
    };
    fetchEvaluations();
  }, []);

  return (
    <div>
      <h1>Evaluations</h1>
      {error && <p>{error}</p>}
      <ul>
        {evaluations.map((evaluation) => (
          <li key={evaluation.evaluationID}>
            {evaluation.evaluationType} - {evaluation.evaluationDate}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EvaluationForm;