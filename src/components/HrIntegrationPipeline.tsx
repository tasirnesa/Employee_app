import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Paper, Typography, Chip, Skeleton, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import api from '../lib/axios';
import { useNavigate } from 'react-router-dom';

interface HrIntegrationPipelineProps {
  userId?: number;
}

const Step: React.FC<{ label: string; active: boolean; detail?: string }> = ({ label, active, detail }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, minWidth: 140, flex: 1 }}>
    {active ? (
      <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20, mt: 0.25 }} />
    ) : (
      <RadioButtonUncheckedIcon sx={{ color: 'text.disabled', fontSize: 20, mt: 0.25 }} />
    )}
    <Box>
      <Typography variant="caption" fontWeight={700} color={active ? '#1e293b' : 'text.secondary'} display="block">
        {label}
      </Typography>
      {detail && (
        <Typography variant="caption" color="text.secondary" display="block">
          {detail}
        </Typography>
      )}
    </Box>
  </Box>
);

const HrIntegrationPipeline: React.FC<HrIntegrationPipelineProps> = ({ userId }) => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['hr-integration-summary', userId],
    queryFn: async () => {
      const res = await api.get(`/api/hr-integration/employee/${userId}/summary`);
      return res.data;
    },
    enabled: !!userId,
  });

  if (!userId) return null;

  if (isLoading) {
    return <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3, mb: 3 }} />;
  }

  const status = data?.integrationStatus || {};
  const tier = data?.meritTier;
  const rating = data?.latestRating;

  return (
    <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid #eef2ff', bgcolor: '#fafbff' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={800} color="#1e293b">
            HR integration pipeline
          </Typography>
          <Typography variant="body2" color="text.secondary">
            How evaluation, performance, compensation, and payroll connect for you
          </Typography>
        </Box>
        {rating > 0 && (
          <Chip
            label={tier ? `${Number(rating).toFixed(1)}/5 · ${tier}` : `${Number(rating).toFixed(1)}/5`}
            color="primary"
            size="small"
            sx={{ fontWeight: 700 }}
          />
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Step
          label="Evaluation"
          active={!!status.evaluationToPerformance}
          detail={data?.evaluations?.length ? `${data.evaluations.length} recent` : 'Complete a review'}
        />
        <ArrowForwardIcon sx={{ color: 'text.disabled', fontSize: 18, display: { xs: 'none', sm: 'block' } }} />
        <Step
          label="Performance"
          active={!!status.evaluationToPerformance}
          detail={data?.projectedBonusPercent ? `${data.projectedBonusPercent}% bonus tier` : undefined}
        />
        <ArrowForwardIcon sx={{ color: 'text.disabled', fontSize: 18, display: { xs: 'none', sm: 'block' } }} />
        <Step
          label="Merit review"
          active={!!status.meritWorkflow}
          detail={status.meritWorkflow ? 'Pending or approved' : 'Score ≥ 3.5 to qualify'}
        />
        <ArrowForwardIcon sx={{ color: 'text.disabled', fontSize: 18, display: { xs: 'none', sm: 'block' } }} />
        <Step
          label="Benefits & perks"
          active={!!status.benefitsLinked || !!status.perksLinked}
          detail={`${data?.benefits?.active ?? 0} benefits · ${data?.perks?.active ?? 0} perks active`}
        />
        <ArrowForwardIcon sx={{ color: 'text.disabled', fontSize: 18, display: { xs: 'none', sm: 'block' } }} />
        <Step
          label="Payroll"
          active={!!status.performanceToPayroll}
          detail={
            data?.latestPayslip?.performanceBonus
              ? `Last bonus: $${Number(data.latestPayslip.performanceBonus).toFixed(2)}`
              : 'Bonus on next run if merit approved'
          }
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
        <Button size="small" variant="outlined" sx={{ borderRadius: 2 }} onClick={() => navigate('/evaluations/view')}>
          Evaluations
        </Button>
        <Button size="small" variant="outlined" sx={{ borderRadius: 2 }} onClick={() => navigate('/payroll')}>
          Payroll
        </Button>
        <Button size="small" variant="outlined" sx={{ borderRadius: 2 }} onClick={() => navigate('/benefits')}>
          Benefits
        </Button>
      </Box>
    </Paper>
  );
};

export default HrIntegrationPipeline;
