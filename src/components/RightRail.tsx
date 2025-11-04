import React from 'react';
import { Box, Typography, Avatar, IconButton, Divider, TextField, InputAdornment, List, ListItem, ListItemAvatar, ListItemText, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CallIcon from '@mui/icons-material/Call';
import EmailIcon from '@mui/icons-material/Email';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useQuery } from '@tanstack/react-query';
import { listEmployees } from '../api/employeeApi';
import type { Employee } from '../types/interfaces';

type ChatMsg = { sender: 'me' | 'them'; text: string; at: string };

const RightRail: React.FC = () => {
	const [query, setQuery] = React.useState('');
	const [chatOpen, setChatOpen] = React.useState(false);
	const [chatWith, setChatWith] = React.useState<Employee | null>(null);
	const [chatInput, setChatInput] = React.useState('');
	const [chatMessages, setChatMessages] = React.useState<ChatMsg[]>([]);

	// Current user
	const { data: me } = useQuery({
		queryKey: ['current-user'],
		queryFn: async () => {
			const token = localStorage.getItem('token');
			const res = await fetch('/api/users/me', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
			if (!res.ok) throw new Error('Failed to load current user');
			return res.json();
		},
	});

	const { data, isLoading } = useQuery({
		queryKey: ['employees', 'right-rail'],
		queryFn: async () => await listEmployees(true),
	});
	const employees: Employee[] = data || [];
	const filtered = React.useMemo(() => {
		if (!query) return employees;
		const q = query.toLowerCase();
		return employees.filter(e => `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) || (e.email || '').toLowerCase().includes(q));
	}, [employees, query]);

	const handleCall = (e: Employee) => {
		if (!e.phone) return;
		window.location.href = `tel:${e.phone}`;
	};
	const handleEmail = (e: Employee) => {
		if (!e.email) return;
		const subject = encodeURIComponent(`Hello ${e.firstName}`);
		const body = encodeURIComponent(
			`Hi ${e.firstName},\n\n` +
			`This is ${me?.fullName || 'a colleague'}.\n\n` +
			`Best regards,\n${me?.fullName || ''}`
		);
		window.location.href = `mailto:${e.email}?subject=${subject}&body=${body}`;
	};
	const storageKeyFor = (empId: number) => `chat:${me?.id || 'me'}:${empId}`;
	const openChat = (e: Employee) => {
		setChatWith(e);
		const key = storageKeyFor(e.id);
		const saved = localStorage.getItem(key);
		const parsedRaw: any[] = saved ? JSON.parse(saved) as any[] : [];
		// Coerce any unknown sender to 'them' so incoming shows distinct styling
		const parsed: ChatMsg[] = parsedRaw.map((m) => ({
			sender: m?.sender === 'me' ? 'me' : 'them',
			text: String(m?.text || ''),
			at: String(m?.at || new Date().toISOString()),
		}));
		setChatMessages(parsed);
		setChatInput('');
		setChatOpen(true);
	};
	const sendChat = () => {
		if (!chatWith || !chatInput.trim()) return;
		const next: ChatMsg[] = [...chatMessages, { sender: 'me', text: chatInput.trim(), at: new Date().toISOString() }];
		setChatMessages(next);
		localStorage.setItem(storageKeyFor(chatWith.id), JSON.stringify(next));
		setChatInput('');
	};

	return (
		<>
			<Box
				component="aside"
				sx={{
					position: 'sticky',
					top: 0,
					alignSelf: 'flex-start',
					width: 320,
					minWidth: 320,
					height: '100vh',
					px: 2,
					py: 2,
					borderLeft: '1px solid',
					borderColor: 'divider',
					bgcolor: 'background.paper',
					display: { xs: 'none', lg: 'block' },
				}}
			>
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
					<Typography variant="subtitle1" fontWeight={700}>
						All Contacts
					</Typography>
					<Typography variant="caption" color="text.secondary">
						{isLoading ? '—' : filtered.length}
					</Typography>
				</Box>
				<TextField
					size="small"
					fullWidth
					placeholder="Search"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon fontSize="small" />
							</InputAdornment>
						),
					}}
				/>

				<Box sx={{ my: 2 }}>
					<Box
						sx={{
							position: 'relative',
							borderRadius: 2,
							overflow: 'hidden',
							background: (theme) => theme.palette.grey[100],
							height: 120,
							mb: 1.5,
						}}
					/>
					<Typography variant="body2" color="text.secondary">
						Quick Connects
					</Typography>
				</Box>

				<Divider sx={{ mb: 1 }} />

				{isLoading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
						<CircularProgress size={20} />
					</Box>
				) : (
				<List dense sx={{ maxHeight: 'calc(100vh - 220px)', overflow: 'auto', pr: 1 }}>
					{filtered.map((e) => (
						<ListItem
							key={e.id}
							secondaryAction={
								<Box sx={{ display: 'flex', gap: 0.5 }}>
									<IconButton size="small" aria-label="call" onClick={() => handleCall(e)} disabled={!e.phone}><CallIcon fontSize="small" /></IconButton>
									<IconButton size="small" aria-label="email" onClick={() => handleEmail(e)} disabled={!e.email}><EmailIcon fontSize="small" /></IconButton>
									<IconButton size="small" aria-label="chat" onClick={() => openChat(e)}><ChatBubbleOutlineIcon fontSize="small" /></IconButton>
								</Box>
							}
							sx={{ px: 0.5 }}
						>
							<ListItemAvatar>
								<Avatar src={e.profileImageUrl || undefined}>{(!e.profileImageUrl && e.firstName) ? e.firstName.charAt(0) : undefined}</Avatar>
							</ListItemAvatar>
							<ListItemText
								primary={`${e.firstName} ${e.lastName}`}
								secondary={
									<Box component="span" sx={{ display: 'inline-flex', gap: 1 }}>
										<Typography variant="caption" color="text.secondary">{e.position || '—'}</Typography>
										<Typography variant="caption">{e.department || '—'}</Typography>
									</Box>
								}
							/>
						</ListItem>
					))}
				</List>
				)}
			</Box>

			{chatWith && (
				<Dialog open={chatOpen} onClose={() => setChatOpen(false)} maxWidth="sm" fullWidth>
					<DialogTitle>Chat with {chatWith.firstName} {chatWith.lastName}</DialogTitle>
					<DialogContent dividers>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 320, overflowY: 'auto' }}>
							{chatMessages.map((m, idx) => {
								const isMe = m.sender === 'me';
								return (
									<Box
										key={idx}
										sx={{
											alignSelf: isMe ? 'flex-end' : 'flex-start',
											bgcolor: isMe ? 'primary.main' : 'warning.light',
											color: isMe ? 'primary.contrastText' : 'text.primary',
											px: 1.5,
											py: 1,
											borderRadius: 2,
											maxWidth: '75%',
										}}
									>
										<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{m.text}</Typography>
										<Typography variant="caption" sx={{ opacity: 0.7 }}>{new Date(m.at).toLocaleString()}</Typography>
									</Box>
								);
							})}
						</Box>
					</DialogContent>
					<DialogActions sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, pb: 2 }}>
						<TextField size="small" fullWidth placeholder="Type a message" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendChat(); }} />
						<Button variant="contained" onClick={sendChat} disabled={!chatInput.trim()}>Send</Button>
					</DialogActions>
				</Dialog>
			)}
		</>
	);
};

export default RightRail;


