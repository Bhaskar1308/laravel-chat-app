<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Events\ChatMessageSent;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api'); 
    }

    public function index()
    {
        return Message::with('user')
            ->latest()
            ->take(50)
            ->get()
            ->reverse()
            ->values();
    }

    public function store(Request $request)
    {
        $request->validate(['body' => 'required']);

        $message = Message::create([
            'user_id' => auth()->id(),
            'body'    => $request->body,
        ]);

        broadcast(new ChatMessageSent($message))->toOthers();

        return $message->load('user');
    }
}
