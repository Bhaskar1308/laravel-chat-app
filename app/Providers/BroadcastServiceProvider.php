<?php

namespace App\Providers;

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\ServiceProvider;

class BroadcastServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot()
{
    Broadcast::routes(['middleware' => ['auth:api']]); // ✅ Use JWT middleware
    require base_path('routes/channels.php');
}

}
