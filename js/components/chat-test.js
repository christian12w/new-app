/**
 * AFZ Chat System - Test & Demo Script
 * This file demonstrates the chat functionality and can be used for testing
 */

// Test function to demonstrate chat functionality
async function testChatSystem() {
    console.log('🚀 Testing AFZ Chat System...');
    
    // Wait for services to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    if (!window.ChatManager) {
        console.error('❌ ChatManager not found');
        return;
    }
    
    if (!window.afzAuthService || !window.afzAuthService.isAuthenticated) {
        console.warn('⚠️ User not authenticated - chat will not work');
        return;
    }
    
    console.log('✅ Chat system ready!');
    console.log('Available features:');
    console.log('  • Real-time messaging');
    console.log('  • Multiple chat channels');
    console.log('  • Channel management (join/leave)');
    console.log('  • Message history');
    console.log('  • User presence indicators');
    console.log('  • Mobile-responsive interface');
    
    // Check if we have channels loaded
    if (window.chatManager && window.chatManager.channels) {
        console.log(`📋 Loaded ${window.chatManager.channels.length} channels:`);
        window.chatManager.channels.forEach(channel => {
            console.log(`  • ${channel.name} (${channel.type}) - ${channel.isMember ? 'Member' : 'Not joined'}`);
        });
    }
    
    return true;
}

// Utility functions for testing
window.AFZChatTest = {
    // Test sending a message
    async sendTestMessage(channelName = null) {
        if (!window.chatManager || !window.chatManager.currentChannel) {
            console.warn('No active channel selected');
            return;
        }
        
        const testMessage = `Hello from AFZ Chat! 👋 (Test message sent at ${new Date().toLocaleTimeString()})`;
        
        try {
            await window.chatManager.handleSendMessage();
            // Manually set the input value and trigger send
            const messageInput = document.getElementById('message-input');
            if (messageInput) {
                messageInput.value = testMessage;
                await window.chatManager.handleSendMessage();
                console.log('✅ Test message sent successfully');
            }
        } catch (error) {
            console.error('❌ Failed to send test message:', error);
        }
    },
    
    // Test joining a channel
    async joinChannel(channelName) {
        if (!window.chatManager) {
            console.warn('ChatManager not available');
            return;
        }
        
        const channel = window.chatManager.channels.find(c => 
            c.name.toLowerCase().includes(channelName.toLowerCase())
        );
        
        if (!channel) {
            console.warn(`Channel '${channelName}' not found`);
            return;
        }
        
        if (channel.isMember) {
            console.log(`Already a member of '${channel.name}'`);
            await window.chatManager.switchChannel(channel.id);
        } else {
            console.log(`Joining channel '${channel.name}'...`);
            await window.chatManager.handleJoinChannel(channel.id);
        }
    },
    
    // Get chat statistics
    getStats() {
        if (!window.chatManager) {
            console.warn('ChatManager not available');
            return null;
        }
        
        const stats = {
            totalChannels: window.chatManager.channels.length,
            memberChannels: window.chatManager.channels.filter(c => c.isMember).length,
            publicChannels: window.chatManager.channels.filter(c => c.type === 'public').length,
            currentChannel: window.chatManager.currentChannel?.name || 'None',
            isInitialized: window.chatManager.isInitialized
        };
        
        console.table(stats);
        return stats;
    },
    
    // Reset chat interface
    async reset() {
        if (window.chatManager) {
            window.chatManager.clearChannelSubscriptions();
            await window.chatManager.init();
            console.log('✅ Chat system reset');
        }
    }
};

// Demo setup instructions
console.log(`
🎯 AFZ Chat System Demo Instructions:

1. Make sure you're logged in to test the chat
2. Navigate to the Chat section in the member hub
3. Try these console commands:

   // Get chat system statistics
   AFZChatTest.getStats()
   
   // Join a specific channel
   AFZChatTest.joinChannel('General')
   
   // Send a test message
   AFZChatTest.sendTestMessage()
   
   // Reset the chat system
   AFZChatTest.reset()

4. Default channels available:
   • General Discussion
   • Healthcare Support  
   • Advocacy & Rights
   • Events & Meetups
   • Youth Support

5. Features to test:
   • Real-time messaging between users
   • Channel switching
   • Message history loading
   • Mobile responsive design
   • Joining/leaving channels
`);

// Auto-run test when page loads if in development mode
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(testChatSystem, 5000);
    });
}