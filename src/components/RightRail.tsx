import React, { useEffect, useRef } from 'react';
import { Box, Typography, Avatar, IconButton, Divider, TextField, InputAdornment, List, ListItem, ListItemAvatar, ListItemText, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ReplyIcon from '@mui/icons-material/Reply';
import CloseIcon from '@mui/icons-material/Close';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers } from '../api/userApi';
import { getMessages, sendMessage } from '../api/messageApi';
import { useUser } from '../context/UserContext';

// Redundant local type replaced by Message from interfaces.ts
type ChatMsg = {
	id?: string;
	sender: 'me' | 'them';
	text: string;
	at: string;
	parentText?: string | null;
	parentSenderId?: number | null;
};
const RightRail: React.FC = () => {
	const [query, setQuery] = React.useState('');
	const [chatOpen, setChatOpen] = React.useState(false);
	const [chatWith, setChatWith] = React.useState<any | null>(null);
	const [chatInput, setChatInput] = React.useState('');
	const [replyTo, setReplyTo] = React.useState<ChatMsg | null>(null);

	const { user: me } = useUser();
	const queryClient = useQueryClient();
	const scrollRef = useRef<HTMLDivElement>(null);

	const { data, isLoading } = useQuery({
		queryKey: ['users', 'right-rail'],
		queryFn: getUsers,
		staleTime: 30000,
	});

	const employees: any[] = React.useMemo(() => data || [], [data]);

	const filtered = React.useMemo(() => {
		if (!query) return employees;
		const q = query.toLowerCase();
		return employees.filter(e => {
			const fullName = `${e.firstName || ''} ${e.lastName || ''}`.toLowerCase();
			const email = (e.email || '').toLowerCase();
			return fullName.includes(q) || email.includes(q);
		});
	}, [employees, query]);

	// Fetch messages for the selected user
	const { data: rawMessages = [] } = useQuery({
		queryKey: ['chat', chatWith?.userId],
		queryFn: () => chatWith?.userId ? getMessages(chatWith.userId) : Promise.resolve([]),
		enabled: !!chatWith?.userId && chatOpen,
		refetchInterval: 3000,
	});

	const chatMessages = React.useMemo(() => {
		return rawMessages.map((m: any) => ({
			id: m.id,
			sender: m.senderId === me?.id ? 'me' : 'them',
			text: m.text || '',
			at: m.createdAt,
			parentText: m.parent?.text,
			parentSenderId: m.parent?.senderId
		})) as ChatMsg[];
	}, [rawMessages, me?.id]);

	const sendMutation = useMutation({
		mutationFn: (text: string) => {
			if (!chatWith?.userId) throw new Error('No target user');
			return sendMessage({
				receiverId: chatWith.userId,
				text,
				parentId: replyTo?.id
			});
		},
		onSuccess: () => {
			setChatInput('');
			setReplyTo(null);
			queryClient.invalidateQueries({ queryKey: ['chat', chatWith?.userId] });
			queryClient.invalidateQueries({ queryKey: ['chat-threads'] });
		},
	});

	const openChat = (e: any) => {
		if (!e.userId) {
			console.warn('Cannot chat with user who has no ID');
			return;
		}
		setChatWith(e);
		setChatInput('');
		setChatOpen(true);
	};

	const sendChat = () => {
		if (!chatWith || !chatInput.trim()) return;
		sendMutation.mutate(chatInput.trim());
	};

	useEffect(() => {
		const handleOpenChatEvent = (event: any) => {
			const { user } = event.detail;
			if (user) {
				console.log('Opening chat via event for:', user.fullName, 'ID:', user.userId || user.id);
				setChatWith({ ...user, userId: user.userId || user.id });
				setChatInput('');
				setChatOpen(true);
			}
		};
		window.addEventListener('open-chat', handleOpenChatEvent);
		return () => window.removeEventListener('open-chat', handleOpenChatEvent);
	}, []);

	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [chatMessages, chatOpen]);

	// If the user isn't logged in yet, don't show the rail
	if (!me) return null;

	return (
		<>
			<Box
				component="aside"
				sx={{
					width: 300,
					minWidth: 300,
					flexShrink: 0,
					height: '100vh',
					position: 'sticky',
					top: 0,
					borderLeft: '1px solid',
					borderColor: 'divider',
					bgcolor: 'background.paper',
					display: { xs: 'none', lg: 'flex' },
					flexDirection: 'column',
					p: 2,
				}}
			>
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
					<Typography variant="subtitle1" fontWeight={700}>All Contacts</Typography>
					<Typography variant="caption" color="text.secondary">{isLoading ? '—' : filtered.length}</Typography>
				</Box>

				<TextField
					size="small"
					fullWidth
					placeholder="Search users..."
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

				<Divider sx={{ my: 2 }} />

				{isLoading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress size={24} /></Box>
				) : (
					<List dense sx={{ overflowY: 'auto', flexGrow: 1, pr: 0.5 }}>
						{filtered.map((e) => {
							const name = (`${e.firstName || ''} ${e.lastName || ''}`.trim() || e.fullName || `User ${e.id}`).trim();
							const isMeItem = e.id === me?.id;
							const targetId = e.userId || e.id;

							return (
								<ListItem
									key={e.id}
									sx={{
										px: 1,
										py: 0.5,
										borderRadius: 1,
										'&:hover': { bgcolor: 'action.hover' },
										display: 'flex',
										alignItems: 'center'
									}}
								>
									<ListItemAvatar sx={{ minWidth: 40 }}>
										<Avatar
											src={e.profileImageUrl || undefined}
											sx={{ width: 32, height: 32, fontSize: '0.875rem' }}
										>
											{name.charAt(0) || '?'}
										</Avatar>
									</ListItemAvatar>
									<ListItemText
										primary={<Typography variant="body2" fontWeight={isMeItem ? 700 : 500} noWrap>{name} {isMeItem && '(You)'}</Typography>}
										secondary={<Typography variant="caption" color="text.secondary" noWrap>{e.role || 'User'}</Typography>}
										sx={{ mr: 1 }}
									/>
									{!isMeItem && (
										<IconButton
											size="small"
											onClick={() => {
												console.log('Opening chat with:', name, 'ID:', targetId);
												setChatWith({ ...e, userId: targetId });
												setChatInput('');
												setChatOpen(true);
											}}
											color="primary"
										>
											<ChatBubbleOutlineIcon fontSize="small" />
										</IconButton>
									)}
								</ListItem>
							);
						})}
					</List>
				)}
			</Box>

			{chatWith && (
				<Dialog open={chatOpen} onClose={() => setChatOpen(false)} maxWidth="xs" fullWidth>
					<DialogTitle sx={{ pb: 1 }}>Chat with {(chatWith.firstName || chatWith.fullName || 'User').trim()}</DialogTitle>
					<DialogContent dividers sx={{ p: 2 }}>
						<Box ref={scrollRef} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 350, overflowY: 'auto', pr: 0.5 }}>
							{chatMessages.map((m, idx) => {
								const isMeMsg = m.sender === 'me';
								return (
									<Box
										key={m.id || idx}
										sx={{
											alignSelf: isMeMsg ? 'flex-end' : 'flex-start',
											bgcolor: isMeMsg ? 'primary.main' : 'grey.200',
											color: isMeMsg ? 'primary.contrastText' : 'text.primary',
											px: 1.5,
											py: 1,
											borderRadius: isMeMsg ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
											maxWidth: '85%',
											boxShadow: 1,
											position: 'relative',
											'&:hover .reply-btn': { opacity: 1 }
										}}
									>
										{m.parentText && (
											<Box sx={{
												bgcolor: isMeMsg ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
												borderLeft: '3px solid',
												borderColor: 'secondary.main',
												p: 1,
												mb: 1,
												borderRadius: 1,
												fontSize: '0.75rem',
												fontStyle: 'italic'
											}}>
												<Typography variant="inherit" noWrap sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
													{m.parentSenderId === me?.id ? 'You' : (chatWith?.firstName || 'User')}
												</Typography>
												<Typography variant="inherit" noWrap>{m.parentText}</Typography>
											</Box>
										)}
										<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{m.text}</Typography>
										<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
											<Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.65rem' }}>
												{new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
											</Typography>
											<IconButton
												className="reply-btn"
												size="small"
												sx={{
													opacity: 0,
													transition: '0.2s',
													p: 0,
													ml: 1,
													color: isMeMsg ? 'rgba(255,255,255,0.7)' : 'action.active'
												}}
												onClick={() => setReplyTo(m)}
											>
												<ReplyIcon sx={{ fontSize: 16 }} />
											</IconButton>
										</Box>
									</Box>
								);
							})}
							{chatMessages.length === 0 && (
								<Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block', my: 4 }}>No messages yet. Send a greeting!</Typography>
							)}
						</Box>
					</DialogContent>
					<Box sx={{ px: 2, pt: 1 }}>
						{replyTo && (
							<Box sx={{
								display: 'flex',
								alignItems: 'center',
								bgcolor: 'grey.100',
								p: 1,
								borderRadius: 1,
								borderLeft: '4px solid',
								borderColor: 'primary.main',
								mb: 1
							}}>
								<Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
									<Typography variant="caption" fontWeight={700} color="primary.main">
										Replying to {replyTo.sender === 'me' ? 'yourself' : (chatWith?.firstName || 'User')}
									</Typography>
									<Typography variant="caption" display="block" noWrap color="text.secondary">
										{replyTo.text}
									</Typography>
								</Box>
								<IconButton size="small" onClick={() => setReplyTo(null)}>
									<CloseIcon sx={{ fontSize: 16 }} />
								</IconButton>
							</Box>
						)}
					</Box>
					<DialogActions sx={{ p: 2, pt: 0 }}>
						<TextField
							size="small"
							fullWidth
							autoFocus
							placeholder="Type a message..."
							value={chatInput}
							onChange={(e) => setChatInput(e.target.value)}
							onKeyDown={(e) => { if (e.key === 'Enter' && chatInput.trim()) sendChat(); }}
						/>
						<Button variant="contained" onClick={sendChat} disabled={!chatInput.trim() || sendMutation.isPending}>
							{sendMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Send'}
						</Button>
					</DialogActions>
				</Dialog>
			)}
		</>
	);
};

export default RightRail;


