/**
 * AFZ Member Hub - Real-time Chat Manager
 * Comprehensive chat system with room management and real-time messaging
 */

class ChatManager {
    constructor() {
        this.currentUser = null;
        this.authService = null;
        this.currentChannel = null;
        this.channels = [];
        this.realtimeSubscriptions = new Map();
        this.isInitialized = false;
        
        // Initialize after auth service is ready
        this.waitForServices().then(() => {
            this.init();
        }).catch(error => {
            console.error('ChatManager initialization failed:', error);
        });
    }

    async waitForServices() {
        let attempts = 0;
        while (!window.afzAuthService && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.afzAuthService || !window.afzAuthService.isAuthenticated) {
            throw new Error('Authentication service not available');
        }
        
        this.authService = window.afzAuthService;
        this.currentUser = this.authService.getCurrentUser();
        console.log('✅ ChatManager services ready for user:', this.currentUser.email);
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            await this.loadChannels();
            await this.setupChatInterface();
            this.setupEventListeners();
            
            // Join default channel if available
            if (this.channels.length > 0 && !this.currentChannel) {
                await this.switchChannel(this.channels[0].id);
            }
            
            this.isInitialized = true;
            console.log('✅ ChatManager initialized successfully');
        } catch (error) {
            console.error('Error initializing ChatManager:', error);
        }
    }

    async loadChannels() {
        if (!window.sb || !this.currentUser) return;
        
        try {
            // Get channels user is a member of
            const { data: channelMembers, error } = await window.sb
                .from('channel_members')
                .select(`
                    channel_id,
                    role,
                    chat_channels!inner (
                        id, name, description, type
                    )
                `)
                .eq('user_id', this.currentUser.id);

            if (error) throw error;

            // Get public channels user hasn't joined
            const memberChannelIds = channelMembers.map(cm => cm.channel_id);
            const { data: publicChannels, error: publicError } = await window.sb
                .from('chat_channels')
                .select('*')
                .eq('type', 'public')
                .not('id', 'in', `(${memberChannelIds.join(',') || 'null'})`);

            if (publicError) throw publicError;

            // Combine channels
            this.channels = [
                ...channelMembers.map(cm => ({
                    ...cm.chat_channels,
                    memberRole: cm.role,
                    isMember: true
                })),
                ...(publicChannels || []).map(channel => ({
                    ...channel,
                    memberRole: null,
                    isMember: false
                }))
            ];

            // Auto-join default channels if user has none
            if (channelMembers.length === 0) {
                await this.autoJoinDefaultChannels();
            }

        } catch (error) {
            console.error('Error loading channels:', error);
            this.channels = [];
        }
    }

    async autoJoinDefaultChannels() {
        try {
            const { data: defaultChannels, error } = await window.sb
                .from('chat_channels')
                .select('*')
                .eq('type', 'public')
                .limit(3);

            if (error) throw error;

            for (const channel of defaultChannels) {
                await this.joinChannel(channel.id);
            }

            await this.loadChannels();
        } catch (error) {
            console.error('Error auto-joining default channels:', error);
        }
    }

    async joinChannel(channelId) {
        if (!window.sb || !this.currentUser) return false;

        try {
            const { error } = await window.sb
                .from('channel_members')
                .upsert({
                    channel_id: channelId,
                    user_id: this.currentUser.id,
                    role: 'member'
                });

            if (error) throw error;

            // Update local channels list
            const channel = this.channels.find(c => c.id === channelId);
            if (channel) {
                channel.isMember = true;
                channel.memberRole = 'member';
            }

            return true;
        } catch (error) {
            console.error('Error joining channel:', error);
            return false;
        }
    }

    async setupChatInterface() {
        const chatContainer = document.getElementById('section-chat');
        if (!chatContainer) return;

        chatContainer.innerHTML = `
            <div class="chat-manager">
                <!-- Chat Header -->
                <div class="chat-header">
                    <div class="chat-room-info">
                        <div class="room-avatar">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="room-details">
                            <h3 class="room-name" id="current-room-name">Select a Channel</h3>
                            <p class="room-description" id="current-room-description">Choose a channel to start chatting</p>
                        </div>
                    </div>
                    <div class="chat-actions">
                        <button class="action-btn mobile-only" id="toggle-channels-btn" title="Show Channels">
                            <i class="fas fa-bars"></i>
                        </button>
                    </div>
                </div>

                <div class="chat-body">
                    <!-- Channels Sidebar -->
                    <div class="channels-sidebar" id="channels-sidebar">
                        <div class="channels-header">
                            <h3>Channels</h3>
                        </div>
                        <div class="channels-list" id="channels-list">
                            ${this.renderChannelsList()}
                        </div>
                    </div>

                    <!-- Messages Area -->
                    <div class="messages-container">
                        <div class="messages-area" id="messages-area">
                            <div class="welcome-message">
                                <div class="welcome-icon">
                                    <i class="fas fa-comments"></i>
                                </div>
                                <h3>Welcome to AFZ Community Chat</h3>
                                <p>Select a channel from the sidebar to start chatting.</p>
                            </div>
                        </div>
                        
                        <!-- Message Input -->
                        <div class="message-input-container" id="message-input-container" style="display: none;">
                            <div class="message-input-wrapper">
                                <div class="message-input-area">
                                    <textarea 
                                        id="message-input" 
                                        placeholder="Type your message..."
                                        rows="1"
                                        maxlength="2000"
                                        disabled
                                    ></textarea>
                                    <button class="send-btn" id="send-message-btn" disabled>
                                        <i class="fas fa-paper-plane"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="message-input-footer">
                                <span class="char-count" id="char-count">0/2000</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.injectStyles();
    }

    renderChannelsList() {
        if (!this.channels || this.channels.length === 0) {
            return '<div class="no-channels"><i class="fas fa-comments"></i><p>No channels available</p></div>';
        }

        return this.channels.map(channel => `
            <div class="channel-item ${channel.id === this.currentChannel?.id ? 'active' : ''}" 
                 data-channel-id="${channel.id}">
                <div class="channel-icon">
                    <i class="fas ${this.getChannelIcon(channel.type)}"></i>
                </div>
                <div class="channel-info">
                    <div class="channel-name">${channel.name}</div>
                    <div class="channel-description">${channel.description || 'No description'}</div>
                </div>
                <div class="channel-meta">
                    ${channel.isMember ? 
                        '<span class="member-badge">Member</span>' : 
                        '<button class="join-btn" data-channel-id="' + channel.id + '">Join</button>'
                    }
                </div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Channel selection and join
        document.addEventListener('click', async (e) => {
            const channelItem = e.target.closest('.channel-item');
            if (channelItem) {
                const channelId = channelItem.dataset.channelId;
                const channel = this.channels.find(c => c.id === channelId);
                
                if (channel && channel.isMember) {
                    await this.switchChannel(channelId);
                }
                return;
            }

            const joinBtn = e.target.closest('.join-btn');
            if (joinBtn) {
                e.stopPropagation();
                const channelId = joinBtn.dataset.channelId;
                await this.handleJoinChannel(channelId);
                return;
            }
        });

        // Message input
        const messageInput = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-message-btn');
        
        if (messageInput) {
            this.messageInput = messageInput;
            
            messageInput.addEventListener('input', () => {
                this.updateCharCount();
                this.updateSendButton();
                this.autoResizeInput();
            });

            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSendMessage();
                }
            });
        }

        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.handleSendMessage());
        }

        // Mobile sidebar toggle
        const toggleBtn = document.getElementById('toggle-channels-btn');
        const sidebar = document.getElementById('channels-sidebar');
        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('show');
            });
        }
    }

    async switchChannel(channelId) {
        try {
            const channel = this.channels.find(c => c.id === channelId);
            if (!channel || !channel.isMember) return;

            this.clearChannelSubscriptions();
            this.currentChannel = channel;

            this.updateChannelHeader(channel);
            this.updateActiveChannel(channelId);
            this.showMessageInput();

            await this.loadChannelMessages(channelId);
            await this.subscribeToChannel(channelId);

        } catch (error) {
            console.error('Error switching channel:', error);
        }
    }

    async loadChannelMessages(channelId) {
        if (!window.sb) return;

        try {
            const { data: messages, error } = await window.sb
                .from('messages')
                .select(`
                    *,
                    profiles!messages_user_id_fkey (
                        display_name, avatar_url, full_name
                    )
                `)
                .eq('channel_id', channelId)
                .order('created_at', { ascending: true })
                .limit(50);

            if (error) throw error;
            this.displayMessages(messages || []);

        } catch (error) {
            console.error('Error loading channel messages:', error);
        }
    }

    displayMessages(messages) {
        const messagesArea = document.getElementById('messages-area');
        if (!messagesArea) return;

        if (messages.length === 0) {
            messagesArea.innerHTML = `
                <div class="no-messages">
                    <div class="no-messages-icon"><i class="fas fa-comments"></i></div>
                    <h3>No messages yet</h3>
                    <p>Be the first to send a message in this channel!</p>
                </div>
            `;
            return;
        }

        const messagesHtml = messages.map(msg => this.renderMessage(msg)).join('');
        messagesArea.innerHTML = messagesHtml;
        this.scrollToBottom();
    }

    renderMessage(message) {
        const user = message.profiles;
        const userName = user?.display_name || user?.full_name || 'Unknown User';
        const userAvatar = user?.avatar_url || this.generateAvatarUrl(userName);
        const isOwnMessage = message.user_id === this.currentUser.id;
        const timestamp = this.formatMessageTime(message.created_at);

        return `
            <div class="message-item ${isOwnMessage ? 'own' : ''}" data-message-id="${message.id}">
                <div class="message-avatar">
                    <img src="${userAvatar}" alt="${userName}" onerror="this.src='${this.generateAvatarUrl(userName)}'">
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-author">${userName}</span>
                        <span class="message-time">${timestamp}</span>
                    </div>
                    <div class="message-text">${this.formatMessageContent(message.content)}</div>
                </div>
            </div>
        `;
    }

    async handleSendMessage() {
        if (!this.messageInput || !this.currentChannel) return;

        const content = this.messageInput.value.trim();
        if (!content) return;

        try {
            const { data, error } = await window.sb
                .from('messages')
                .insert({
                    channel_id: this.currentChannel.id,
                    user_id: this.currentUser.id,
                    content: content,
                    message_type: 'text'
                })
                .select(`
                    *,
                    profiles!messages_user_id_fkey (
                        display_name, avatar_url, full_name
                    )
                `)
                .single();

            if (error) throw error;

            this.messageInput.value = '';
            this.updateCharCount();
            this.updateSendButton();
            this.autoResizeInput();
            this.addMessageToUI(data);

        } catch (error) {
            console.error('Error sending message:', error);
            this.showNotification('Failed to send message', 'error');
        }
    }

    async subscribeToChannel(channelId) {
        if (!window.sb) return;

        try {
            const subscription = window.sb
                .channel(`chat-${channelId}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `channel_id=eq.${channelId}`
                }, async (payload) => {
                    await this.handleNewMessage(payload.new);
                })
                .subscribe();

            this.realtimeSubscriptions.set(channelId, subscription);
            console.log(`✅ Subscribed to channel: ${channelId}`);

        } catch (error) {
            console.error('Error setting up channel subscription:', error);
        }
    }

    async handleNewMessage(message) {
        if (message.user_id === this.currentUser.id) return;

        try {
            const { data: profile, error } = await window.sb
                .from('profiles')
                .select('display_name, avatar_url, full_name')
                .eq('id', message.user_id)
                .single();

            if (error) return;

            const messageWithProfile = { ...message, profiles: profile };
            this.addMessageToUI(messageWithProfile);

        } catch (error) {
            console.error('Error handling new message:', error);
        }
    }

    addMessageToUI(message) {
        const messagesArea = document.getElementById('messages-area');
        if (!messagesArea) return;

        const noMessages = messagesArea.querySelector('.no-messages');
        if (noMessages) noMessages.remove();

        const messageHtml = this.renderMessage(message);
        messagesArea.insertAdjacentHTML('beforeend', messageHtml);
        this.scrollToBottom();
    }

    async handleJoinChannel(channelId) {
        const success = await this.joinChannel(channelId);
        if (success) {
            this.showNotification('Joined channel successfully!', 'success');
            this.updateChannelsList();
            await this.switchChannel(channelId);
        } else {
            this.showNotification('Failed to join channel', 'error');
        }
    }

    // Utility methods
    getChannelIcon(type) {
        return type === 'public' ? 'fa-hashtag' : type === 'private' ? 'fa-lock' : 'fa-comments';
    }

    generateAvatarUrl(name) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=DAA520&color=000000&size=40`;
    }

    formatMessageTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    }

    formatMessageContent(content) {
        return content
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    }

    updateChannelHeader(channel) {
        const roomName = document.getElementById('current-room-name');
        const roomDescription = document.getElementById('current-room-description');
        
        if (roomName) roomName.textContent = channel.name;
        if (roomDescription) roomDescription.textContent = channel.description || 'No description';
    }

    updateActiveChannel(channelId) {
        document.querySelectorAll('.channel-item').forEach(item => {
            item.classList.toggle('active', item.dataset.channelId === channelId);
        });
    }

    showMessageInput() {
        const inputContainer = document.getElementById('message-input-container');
        const messageInput = document.getElementById('message-input');
        
        if (inputContainer) inputContainer.style.display = 'block';
        if (messageInput) messageInput.disabled = false;
    }

    updateCharCount() {
        const charCount = document.getElementById('char-count');
        if (charCount && this.messageInput) {
            const length = this.messageInput.value.length;
            charCount.textContent = `${length}/2000`;
        }
    }

    updateSendButton() {
        const sendBtn = document.getElementById('send-message-btn');
        if (sendBtn && this.messageInput) {
            sendBtn.disabled = !this.messageInput.value.trim();
        }
    }

    autoResizeInput() {
        if (this.messageInput) {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
        }
    }

    scrollToBottom() {
        const messagesArea = document.getElementById('messages-area');
        if (messagesArea) {
            messagesArea.scrollTop = messagesArea.scrollHeight;
        }
    }

    clearChannelSubscriptions() {
        this.realtimeSubscriptions.forEach((subscription) => {
            if (window.sb) window.sb.removeChannel(subscription);
        });
        this.realtimeSubscriptions.clear();
    }

    updateChannelsList() {
        const channelsList = document.getElementById('channels-list');
        if (channelsList) {
            channelsList.innerHTML = this.renderChannelsList();
        }
    }

    showNotification(message, type = 'info') {
        if (window.afzMemberHub?.showToastNotification) {
            window.afzMemberHub.showToastNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    injectStyles() {
        if (document.getElementById('chat-manager-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'chat-manager-styles';
        styles.textContent = `
            .chat-manager { height: 100%; display: flex; flex-direction: column; background: var(--surface-color); border-radius: 16px; overflow: hidden; }
            .chat-header { display: flex; align-items: center; justify-content: space-between; padding: 20px; border-bottom: 1px solid var(--border-color); background: var(--surface-color); }
            .chat-room-info { display: flex; align-items: center; gap: 12px; }
            .room-avatar { width: 48px; height: 48px; background: var(--primary-color); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; }
            .room-details h3 { margin: 0; font-size: 18px; font-weight: 600; color: var(--text-primary); }
            .room-details p { margin: 4px 0 0; font-size: 14px; color: var(--text-secondary); }
            .action-btn { width: 40px; height: 40px; border: none; background: var(--surface-hover); border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-secondary); }
            .action-btn:hover { background: var(--primary-color); color: white; }
            .chat-body { flex: 1; display: flex; min-height: 0; }
            .channels-sidebar { width: 280px; background: var(--surface-color); border-right: 1px solid var(--border-color); padding: 20px; overflow-y: auto; }
            .channels-header h3 { margin: 0 0 20px; font-size: 16px; font-weight: 600; color: var(--text-primary); }
            .channel-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; cursor: pointer; margin-bottom: 8px; }
            .channel-item:hover { background: var(--surface-hover); }
            .channel-item.active { background: var(--primary-light); color: var(--primary-color); }
            .channel-icon { width: 32px; height: 32px; background: var(--surface-hover); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; }
            .channel-item.active .channel-icon { background: var(--primary-color); color: white; }
            .channel-info { flex: 1; }
            .channel-name { font-weight: 500; color: var(--text-primary); margin-bottom: 2px; }
            .channel-description { font-size: 12px; color: var(--text-secondary); }
            .member-badge { font-size: 11px; padding: 2px 6px; background: var(--success-light); color: var(--success-color); border-radius: 10px; }
            .join-btn { font-size: 11px; padding: 4px 8px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer; }
            .messages-container { flex: 1; display: flex; flex-direction: column; min-height: 0; }
            .messages-area { flex: 1; padding: 20px; overflow-y: auto; }
            .welcome-message, .no-messages { text-align: center; padding: 60px 20px; }
            .welcome-icon, .no-messages-icon { font-size: 48px; color: var(--text-secondary); margin-bottom: 16px; }
            .welcome-message h3, .no-messages h3 { margin: 0 0 8px; color: var(--text-primary); }
            .welcome-message p, .no-messages p { margin: 0; color: var(--text-secondary); }
            .message-item { display: flex; gap: 12px; margin-bottom: 16px; }
            .message-avatar img { width: 36px; height: 36px; border-radius: 50%; }
            .message-content { flex: 1; }
            .message-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
            .message-author { font-weight: 600; color: var(--text-primary); font-size: 14px; }
            .message-time { font-size: 12px; color: var(--text-secondary); }
            .message-text { color: var(--text-primary); line-height: 1.5; }
            .message-input-container { padding: 20px; border-top: 1px solid var(--border-color); }
            .message-input-wrapper { display: flex; gap: 12px; align-items: flex-end; }
            .message-input-area { flex: 1; position: relative; }
            .message-input-area textarea { width: 100%; background: var(--surface-hover); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px 60px 12px 16px; font-family: inherit; color: var(--text-primary); resize: none; outline: none; min-height: 44px; max-height: 120px; }
            .message-input-area textarea:focus { border-color: var(--primary-color); background: var(--surface-color); }
            .send-btn { position: absolute; right: 8px; bottom: 8px; background: var(--primary-color); color: white; border: none; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; }
            .send-btn:disabled { background: var(--border-color); cursor: not-allowed; }
            .message-input-footer { display: flex; justify-content: flex-end; margin-top: 8px; }
            .char-count { font-size: 12px; color: var(--text-secondary); }
            .no-channels { text-align: center; padding: 40px 20px; color: var(--text-secondary); }
            @media (max-width: 768px) {
                .channels-sidebar { position: absolute; left: 0; top: 0; height: 100%; z-index: 100; transform: translateX(-100%); }
                .channels-sidebar.show { transform: translateX(0); }
                .mobile-only { display: flex; }
            }
            @media (min-width: 769px) { .mobile-only { display: none; } }
        `;
        document.head.appendChild(styles);
    }
}

// Export for use in member hub
window.ChatManager = ChatManager;