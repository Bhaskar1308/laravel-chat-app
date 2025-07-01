<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;


class ChatMessageSent implements ShouldBroadcast
{
    use InteractsWithSockets, SerializesModels;

    public function __construct(public Message $message) {}

    public function broadcastOn(): Channel
    {
        // everyone in the room hears it – adjust your channel naming as needed
        return new PresenceChannel('chatroom');
    }

    public function broadcastWith(): array
    {
        return [
            'id'      => $this->message->id,
            'user'    => $this->message->user->only('id', 'name'),
            'body'    => $this->message->body,
            'created' => $this->message->created_at->toISOString(),
        ];
    }
}