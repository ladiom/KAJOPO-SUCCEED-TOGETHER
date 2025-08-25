/**
 * Kájọpọ̀ Connect Messaging System
 * Handles user-to-user messaging functionality
 */

class MessagingSystem {
    constructor() {
        this.storageKey = 'kajopo_messages';
        this.conversationsKey = 'kajopo_conversations';
        this.currentUser = null;
        this.activeConversation = null;
        this.messageListeners = [];
    }

    /**
     * Initialize messaging system
     */
    init() {
        this.currentUser = JSON.parse(localStorage.getItem('kajopo_user'));
        if (!this.currentUser) {
            console.warn('No user logged in for messaging');
            return false;
        }
        
        this.setupEventListeners();
        this.loadConversations();
        return true;
    }

    /**
     * Setup event listeners for messaging UI
     */
    setupEventListeners() {
        // Send message form
        const sendForm = document.getElementById('sendMessageForm');
        if (sendForm) {
            sendForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSendMessage(e.target);
            });
        }

        // New conversation form
        const newConversationForm = document.getElementById('newConversationForm');
        if (newConversationForm) {
            newConversationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNewConversation(e.target);
            });
        }

        // Search conversations
        const searchInput = document.getElementById('conversationSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchConversations(e.target.value);
            });
        }

        // Auto-refresh messages
        setInterval(() => {
            if (this.activeConversation) {
                this.loadMessages(this.activeConversation);
            }
        }, 5000);
    }

    /**
     * Get all conversations for current user
     * @returns {Array} User conversations
     */
    getConversations() {
        const conversations = JSON.parse(localStorage.getItem(this.conversationsKey)) || [];
        return conversations.filter(conv => 
            conv.participants.includes(this.currentUser.id)
        );
    }

    /**
     * Get messages for a conversation
     * @param {string} conversationId - Conversation ID
     * @returns {Array} Messages
     */
    getMessages(conversationId) {
        const messages = JSON.parse(localStorage.getItem(this.storageKey)) || [];
        return messages.filter(msg => msg.conversationId === conversationId)
                      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    /**
     * Send a new message
     * @param {string} conversationId - Conversation ID
     * @param {string} content - Message content
     * @param {string} type - Message type (text, file, etc.)
     * @returns {Object} Sent message
     */
    sendMessage(conversationId, content, type = 'text') {
        const message = {
            id: this.generateId(),
            conversationId: conversationId,
            senderId: this.currentUser.id,
            senderName: this.currentUser.name,
            content: content,
            type: type,
            timestamp: new Date().toISOString(),
            read: false
        };

        // Save message
        const messages = JSON.parse(localStorage.getItem(this.storageKey)) || [];
        messages.push(message);
        localStorage.setItem(this.storageKey, JSON.stringify(messages));

        // Update conversation last message
        this.updateConversationLastMessage(conversationId, message);

        // Notify listeners
        this.notifyMessageListeners('messageSent', message);

        return message;
    }

    /**
     * Create a new conversation
     * @param {Array} participantIds - Array of participant user IDs
     * @param {string} title - Conversation title (optional)
     * @returns {Object} New conversation
     */
    createConversation(participantIds, title = null) {
        // Ensure current user is included
        if (!participantIds.includes(this.currentUser.id)) {
            participantIds.push(this.currentUser.id);
        }

        // Check if conversation already exists
        const existingConv = this.findExistingConversation(participantIds);
        if (existingConv) {
            return existingConv;
        }

        const conversation = {
            id: this.generateId(),
            participants: participantIds,
            title: title || this.generateConversationTitle(participantIds),
            createdAt: new Date().toISOString(),
            lastMessage: null,
            lastActivity: new Date().toISOString()
        };

        // Save conversation
        const conversations = JSON.parse(localStorage.getItem(this.conversationsKey)) || [];
        conversations.push(conversation);
        localStorage.setItem(this.conversationsKey, JSON.stringify(conversations));

        return conversation;
    }

    /**
     * Find existing conversation between participants
     * @param {Array} participantIds - Participant IDs
     * @returns {Object|null} Existing conversation or null
     */
    findExistingConversation(participantIds) {
        const conversations = this.getConversations();
        return conversations.find(conv => {
            return conv.participants.length === participantIds.length &&
                   conv.participants.every(id => participantIds.includes(id));
        });
    }

    /**
     * Generate conversation title from participants
     * @param {Array} participantIds - Participant IDs
     * @returns {string} Generated title
     */
    generateConversationTitle(participantIds) {
        const users = JSON.parse(localStorage.getItem('kajopo_users')) || [];
        const participantNames = participantIds
            .filter(id => id !== this.currentUser.id)
            .map(id => {
                const user = users.find(u => u.id === id);
                return user ? user.name : 'Unknown User';
            });
        
        return participantNames.join(', ') || 'New Conversation';
    }

    /**
     * Update conversation's last message
     * @param {string} conversationId - Conversation ID
     * @param {Object} message - Last message
     */
    updateConversationLastMessage(conversationId, message) {
        const conversations = JSON.parse(localStorage.getItem(this.conversationsKey)) || [];
        const convIndex = conversations.findIndex(conv => conv.id === conversationId);
        
        if (convIndex !== -1) {
            conversations[convIndex].lastMessage = {
                content: message.content,
                timestamp: message.timestamp,
                senderName: message.senderName
            };
            conversations[convIndex].lastActivity = message.timestamp;
            localStorage.setItem(this.conversationsKey, JSON.stringify(conversations));
        }
    }

    /**
     * Mark messages as read
     * @param {string} conversationId - Conversation ID
     */
    markMessagesAsRead(conversationId) {
        const messages = JSON.parse(localStorage.getItem(this.storageKey)) || [];
        let updated = false;

        messages.forEach(message => {
            if (message.conversationId === conversationId && 
                message.senderId !== this.currentUser.id && 
                !message.read) {
                message.read = true;
                updated = true;
            }
        });

        if (updated) {
            localStorage.setItem(this.storageKey, JSON.stringify(messages));
        }
    }

    /**
     * Get unread message count
     * @param {string} conversationId - Conversation ID (optional)
     * @returns {number} Unread count
     */
    getUnreadCount(conversationId = null) {
        const messages = JSON.parse(localStorage.getItem(this.storageKey)) || [];
        return messages.filter(msg => {
            const isUnread = !msg.read && msg.senderId !== this.currentUser.id;
            return conversationId ? (isUnread && msg.conversationId === conversationId) : isUnread;
        }).length;
    }

    /**
     * Search conversations
     * @param {string} query - Search query
     * @returns {Array} Filtered conversations
     */
    searchConversations(query) {
        if (!query.trim()) {
            this.loadConversations();
            return;
        }

        const conversations = this.getConversations();
        const filtered = conversations.filter(conv => 
            conv.title.toLowerCase().includes(query.toLowerCase())
        );

        this.renderConversations(filtered);
    }

    /**
     * Load and render conversations
     */
    loadConversations() {
        const conversations = this.getConversations()
            .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
        this.renderConversations(conversations);
    }

    /**
     * Render conversations list
     * @param {Array} conversations - Conversations to render
     */
    renderConversations(conversations) {
        const container = document.getElementById('conversationsList');
        if (!container) return;

        if (conversations.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <p>No conversations yet</p>
                    <p class="text-sm">Start a new conversation to connect with others</p>
                </div>
            `;
            return;
        }

        container.innerHTML = conversations.map(conv => {
            const unreadCount = this.getUnreadCount(conv.id);
            const lastMessage = conv.lastMessage;
            
            return `
                <div class="conversation-item p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                    this.activeConversation === conv.id ? 'bg-kajopo-blue bg-opacity-10' : ''
                }" data-conversation-id="${conv.id}">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h3 class="font-semibold text-gray-900">${conv.title}</h3>
                            ${lastMessage ? `
                                <p class="text-sm text-gray-600 truncate">
                                    ${lastMessage.senderName}: ${lastMessage.content}
                                </p>
                                <p class="text-xs text-gray-400">
                                    ${this.formatTimestamp(lastMessage.timestamp)}
                                </p>
                            ` : '<p class="text-sm text-gray-500">No messages yet</p>'}
                        </div>
                        ${unreadCount > 0 ? `
                            <span class="bg-kajopo-orange text-white text-xs rounded-full px-2 py-1">
                                ${unreadCount}
                            </span>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Add click listeners
        container.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', () => {
                const conversationId = item.dataset.conversationId;
                this.selectConversation(conversationId);
            });
        });
    }

    /**
     * Select and load a conversation
     * @param {string} conversationId - Conversation ID
     */
    selectConversation(conversationId) {
        this.activeConversation = conversationId;
        this.markMessagesAsRead(conversationId);
        this.loadMessages(conversationId);
        this.loadConversations(); // Refresh to update unread counts
    }

    /**
     * Load and render messages for a conversation
     * @param {string} conversationId - Conversation ID
     */
    loadMessages(conversationId) {
        const messages = this.getMessages(conversationId);
        this.renderMessages(messages);
    }

    /**
     * Render messages
     * @param {Array} messages - Messages to render
     */
    renderMessages(messages) {
        const container = document.getElementById('messagesList');
        if (!container) return;

        if (messages.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <p>No messages in this conversation</p>
                    <p class="text-sm">Send a message to start the conversation</p>
                </div>
            `;
            return;
        }

        container.innerHTML = messages.map(msg => {
            const isOwn = msg.senderId === this.currentUser.id;
            return `
                <div class="message mb-4 ${isOwn ? 'text-right' : 'text-left'}">
                    <div class="inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isOwn 
                            ? 'bg-kajopo-blue text-white' 
                            : 'bg-gray-200 text-gray-900'
                    }">
                        ${!isOwn ? `<p class="text-xs font-semibold mb-1">${msg.senderName}</p>` : ''}
                        <p>${msg.content}</p>
                        <p class="text-xs mt-1 opacity-75">
                            ${this.formatTimestamp(msg.timestamp)}
                        </p>
                    </div>
                </div>
            `;
        }).join('');

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    /**
     * Handle send message form submission
     * @param {HTMLFormElement} form - Form element
     */
    handleSendMessage(form) {
        const messageInput = form.querySelector('[name="message"]');
        const content = messageInput.value.trim();

        if (!content || !this.activeConversation) {
            return;
        }

        this.sendMessage(this.activeConversation, content);
        messageInput.value = '';
        this.loadMessages(this.activeConversation);
    }

    /**
     * Handle new conversation form submission
     * @param {HTMLFormElement} form - Form element
     */
    handleNewConversation(form) {
        const recipientEmail = form.querySelector('[name="recipientEmail"]').value.trim();
        const message = form.querySelector('[name="message"]').value.trim();

        if (!recipientEmail || !message) {
            formValidator.showErrorMessage('Please fill in all fields');
            return;
        }

        // Find recipient user
        const users = JSON.parse(localStorage.getItem('kajopo_users')) || [];
        const recipient = users.find(user => user.email === recipientEmail);

        if (!recipient) {
            formValidator.showErrorMessage('User not found with that email address');
            return;
        }

        // Create conversation
        const conversation = this.createConversation([recipient.id]);
        
        // Send initial message
        this.sendMessage(conversation.id, message);
        
        // Select the new conversation
        this.selectConversation(conversation.id);
        
        // Clear form
        form.reset();
        
        // Close modal if exists
        const modal = document.getElementById('newConversationModal');
        if (modal) {
            modal.style.display = 'none';
        }

        formValidator.showSuccessMessage('Message sent successfully!');
    }

    /**
     * Format timestamp for display
     * @param {string} timestamp - ISO timestamp
     * @returns {string} Formatted timestamp
     */
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }

    /**
     * Generate unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Add message listener
     * @param {Function} callback - Callback function
     */
    addMessageListener(callback) {
        this.messageListeners.push(callback);
    }

    /**
     * Notify message listeners
     * @param {string} event - Event type
     * @param {Object} data - Event data
     */
    notifyMessageListeners(event, data) {
        this.messageListeners.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Error in message listener:', error);
            }
        });
    }
}

// Global messaging system instance
const messagingSystem = new MessagingSystem();

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('conversationsList') || document.getElementById('messagesList')) {
        messagingSystem.init();
    }
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MessagingSystem, messagingSystem };
}