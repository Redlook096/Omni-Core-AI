import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Video, Settings, Trash2, Plus, Play, Pause, Volume2, VolumeX, Maximize, Minimize, Music, Image as ImageIcon, Send } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FakeMessage {
  id: string;
  text: string;
  isSender: boolean;
}

interface FakeTextStoryProps {
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

export function FakeTextStory({ onFullscreenChange }: FakeTextStoryProps = {}) {
  const [profileName, setProfileName] = useState('Unknown');
  const [messages, setMessages] = useState<FakeMessage[]>([
    { id: '1', text: 'hello', isSender: false },
    { id: '2', text: 'hey bro', isSender: true },
    { id: '3', text: 'what is going on?', isSender: true },
    { id: '4', text: 'nothing much', isSender: false },
  ]);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const MESSAGE_INTERVAL = 2; // seconds per message
  const duration = Math.max(messages.filter(m => m.text).length * MESSAGE_INTERVAL, 1);

  useEffect(() => {
    onFullscreenChange?.(isFullscreen);
  }, [isFullscreen, onFullscreenChange]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return prev + 0.05; // Smoother updates
        });
      }, 50); // Faster interval for smoother scrubber
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const handlePlayPause = () => {
    if (currentTime >= duration) {
      setCurrentTime(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(parseFloat(e.target.value));
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const addMessage = () => {
    setMessages([...messages, { id: Date.now().toString(), text: '', isSender: true }]);
  };

  const updateMessage = (id: string, text: string) => {
    setMessages(messages.map(m => m.id === id ? { ...m, text } : m));
  };

  const toggleSender = (id: string) => {
    setMessages(messages.map(m => m.id === id ? { ...m, isSender: !m.isSender } : m));
  };

  const deleteMessage = (id: string) => {
    setMessages(messages.filter(m => m.id !== id));
  };

  const swapAll = () => {
    setMessages(messages.map(m => ({ ...m, isSender: !m.isSender })));
  };

  const deleteAll = () => {
    setMessages([]);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const validMessages = messages.filter(m => m.text);
  const visibleMessages = validMessages.filter((_, idx) => currentTime >= idx * MESSAGE_INTERVAL);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const renderControls = (isFull: boolean) => (
    <div className={cn(
      "flex flex-col gap-2",
      isFull ? "w-full max-w-5xl mx-auto" : "absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-20"
    )}>
      <div className="flex items-center gap-3">
        {isFull && (
          <button onClick={handlePlayPause} className="hover:text-gray-300 transition-colors">
            {isPlaying ? <Pause className="w-6 h-6 fill-white text-white" /> : <Play className="w-6 h-6 fill-white text-white" />}
          </button>
        )}
        {isFull && (
          <button onClick={() => setIsMuted(!isMuted)} className="hover:text-gray-300 transition-colors">
            {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
          </button>
        )}
        {isFull && (
          <span className="text-sm font-medium text-white w-24 text-center">{formatTime(currentTime)} / {formatTime(duration)}</span>
        )}
        
        {!isFull && (
          <span className="text-xs font-medium text-white w-8 text-right">{formatTime(currentTime)}</span>
        )}
        
        <input 
          type="range" 
          min="0" 
          max={duration} 
          step="0.01"
          value={currentTime}
          onChange={handleScrub}
          className={cn(
            "flex-1 bg-white/30 rounded-full appearance-none cursor-pointer transition-all",
            isFull 
              ? "h-1.5 hover:h-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full" 
              : "h-1.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
          )}
        />
        
        {!isFull && (
          <span className="text-xs font-medium text-white w-8">{formatTime(duration)}</span>
        )}

        {isFull && (
          <button onClick={() => setIsFullscreen(false)} className="hover:text-gray-300 transition-colors ml-2">
            <Minimize className="w-6 h-6 text-white" />
          </button>
        )}
      </div>
      
      {!isFull && (
        <div className="flex items-center justify-between text-white mt-1">
          <div className="flex items-center gap-4">
            <button onClick={handlePlayPause} className="hover:text-gray-300 transition-colors">
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
            </button>
            <button onClick={() => setIsMuted(!isMuted)} className="hover:text-gray-300 transition-colors">
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
          <button onClick={() => setIsFullscreen(true)} className="hover:text-gray-300 transition-colors">
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );

  const renderPhoneContent = () => (
    <>
      {/* iMessage Overlay */}
      <div className="absolute top-[11%] left-[8%] right-[8%] bg-black rounded-[8cqw] flex flex-col shadow-[0_15px_30px_rgba(0,0,0,0.4)] max-h-[85%] border border-white/10 overflow-hidden h-fit">
        
        {/* iMessage Header */}
        <div className="h-[18cqw] bg-[#1c1c1e] flex items-center justify-between px-[3cqw] z-10 shrink-0 border-b border-white/5">
          <div className="flex items-center gap-[0.5cqw] text-[#0a84ff] w-[14cqw]">
            <ChevronLeft className="w-[5.5cqw] h-[5.5cqw] -ml-[1cqw]" strokeWidth={2.5} />
            <div className="bg-[#0a84ff] text-white text-[3cqw] font-bold w-[5cqw] h-[5cqw] rounded-full flex items-center justify-center">
              99
            </div>
          </div>
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="w-[8.5cqw] h-[8.5cqw] rounded-full bg-[#8e8e93] flex items-center justify-center text-white text-[4cqw] font-medium mb-[0.5cqw]">
              {profileName.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex items-center gap-[0.5cqw]">
              <span className="text-[3cqw] font-medium text-white">{profileName}</span>
              <ChevronLeft className="w-[2cqw] h-[2cqw] text-[#8e8e93] rotate-180" strokeWidth={3} />
            </div>
          </div>
          <div className="w-[14cqw] flex justify-end">
            <Video className="w-[6cqw] h-[6cqw] text-[#0a84ff]" strokeWidth={2} />
          </div>
        </div>

        {/* iMessage Body */}
        <div className="p-[3cqw] flex flex-col gap-[1.5cqw] bg-black overflow-y-auto custom-scrollbar pb-[3cqw] flex-1 min-h-0">
          <AnimatePresence initial={false}>
            {visibleMessages.map((msg, idx) => {
              const isLastFromSender = idx === visibleMessages.length - 1 || visibleMessages[idx + 1].isSender !== msg.isSender;
              return (
                <motion.div 
                  key={msg.id} 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={cn(
                    "relative max-w-[80%] px-[3cqw] py-[1.8cqw] text-[3.5cqw] leading-tight rounded-[4cqw] z-0",
                    msg.isSender 
                      ? "bg-[#0a84ff] text-white self-end" 
                      : "bg-[#262628] text-white self-start"
                  )}
                >
                  {msg.text}
                  {isLastFromSender && msg.isSender && (
                    <>
                      <div className="absolute bottom-0 -right-[1.5cqw] w-[4cqw] h-[4cqw] bg-[#0a84ff] rounded-bl-[3.5cqw]" style={{ zIndex: -1 }} />
                      <div className="absolute bottom-0 -right-[2.5cqw] w-[2.5cqw] h-[4cqw] bg-black rounded-bl-[2.5cqw]" style={{ zIndex: -1 }} />
                    </>
                  )}
                  {isLastFromSender && !msg.isSender && (
                    <>
                      <div className="absolute bottom-0 -left-[1.5cqw] w-[4cqw] h-[4cqw] bg-[#262628] rounded-br-[3.5cqw]" style={{ zIndex: -1 }} />
                      <div className="absolute bottom-0 -left-[2.5cqw] w-[2.5cqw] h-[4cqw] bg-black rounded-br-[2.5cqw]" style={{ zIndex: -1 }} />
                    </>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>
    </>
  );

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-6 p-6 max-w-7xl mx-auto text-[var(--text-primary)] items-stretch justify-center min-h-0">
      
      {/* Left Panel - Controls */}
      <div className="flex-1 flex flex-col gap-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm h-[600px] max-h-full min-h-0">
        <div className="flex justify-between items-center shrink-0">
          <h2 className="text-2xl font-semibold">Text Script</h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-full border border-[var(--border-color)] text-sm font-medium hover:bg-[var(--bg-hover)] transition-colors">
              Import
            </button>
            <button className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
              AI Writer
            </button>
          </div>
        </div>

        {/* Profile Section */}
        <div className="flex items-center gap-4 mt-4 shrink-0">
          <div className="w-12 h-12 rounded-full bg-gray-500 flex items-center justify-center text-white text-xl font-medium shrink-0">
            {profileName.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <label className="text-xs text-[var(--text-secondary)] mb-1 block">Profile Name</label>
            <input 
              type="text" 
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full bg-transparent border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Messages Header */}
        <div className="flex justify-between items-center mt-2 shrink-0">
          <h3 className="text-lg font-medium">Messages</h3>
          <div className="flex gap-2">
            <button onClick={swapAll} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-color)] text-xs font-medium hover:bg-[var(--bg-hover)] transition-colors">
              Swap All <Settings className="w-3 h-3" />
            </button>
            <button onClick={deleteAll} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-color)] text-xs font-medium hover:bg-[var(--bg-hover)] transition-colors text-red-500 hover:text-red-400">
              Delete All <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-2 custom-scrollbar scrollbar-light min-h-0">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="flex items-center gap-3 overflow-hidden shrink-0"
              >
                <div className="flex-1 flex items-center gap-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-3 py-2">
                  {idx === messages.length - 1 && !msg.text ? (
                    <ImageIcon className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  ) : (
                    <Music className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  )}
                  <input 
                    type="text"
                    value={msg.text}
                    onChange={(e) => updateMessage(msg.id, e.target.value)}
                    placeholder="Type your message here..."
                    className="w-full bg-transparent border-none outline-none text-sm"
                  />
                </div>
                
                {/* Toggle Sender */}
                <button 
                  onClick={() => toggleSender(msg.id)}
                  className={cn(
                    "w-12 h-6 rounded-full flex items-center px-1 transition-colors shrink-0",
                    msg.isSender ? "bg-blue-600 justify-end" : "bg-[var(--bg-hover)] border border-[var(--border-color)] justify-start"
                  )}
                >
                  <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                    <Send className={cn("w-2.5 h-2.5", msg.isSender ? "text-blue-600" : "text-gray-500")} />
                  </div>
                </button>

                <button onClick={() => deleteMessage(msg.id)} className="p-2 text-[var(--text-muted)] hover:text-red-500 transition-colors shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <button 
          onClick={addMessage}
          className="w-full py-3 rounded-lg border border-[var(--border-color)] border-dashed text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors flex items-center justify-center gap-2 mt-2"
        >
          <Plus className="w-4 h-4" /> Add Message
        </button>
      </div>

      {/* Right Panel - Preview */}
      <div className="w-full md:w-[400px] flex flex-col gap-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm h-[600px] max-h-full min-h-0 shrink-0">
        <h2 className="text-2xl font-semibold shrink-0">Video Preview</h2>
        
        <div className="flex-1 flex items-center justify-center rounded-xl relative overflow-hidden border border-[var(--border-color)] bg-[var(--bg-app)] min-h-0">
          
          {/* Phone Container (Normal View) */}
          <div 
            className="relative bg-[#84cc16] flex flex-col overflow-hidden shadow-2xl h-full max-h-[600px] aspect-[9/16] rounded-[2rem] border-4 border-gray-800 shrink-0"
            style={{ containerType: 'inline-size' }}
          >
            {renderPhoneContent()}
            {renderControls(false)}
          </div>
        </div>
      </div>

      {/* Fullscreen Overlay */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] bg-black flex flex-col"
          >
            <div className="flex-1 flex items-center justify-center min-h-0 relative">
              {/* Video Container (Fullscreen) */}
              <motion.div 
                layoutId="video-container"
                className="relative bg-[#84cc16] h-full w-full sm:w-auto sm:aspect-[9/16] overflow-hidden"
                style={{ containerType: 'inline-size' }}
              >
                {renderPhoneContent()}
              </motion.div>
              
              {/* Fullscreen Controls overlaying the bottom of the video */}
              <div className="absolute bottom-0 left-0 right-0 pt-16 pb-8 px-6 bg-gradient-to-t from-black via-black/80 to-transparent z-50">
                {renderControls(true)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
