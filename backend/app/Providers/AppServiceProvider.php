<?php

namespace App\Providers;

use App\Services\FcmMessageSender;
use App\Services\FirebaseFcmMessageSender;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(FcmMessageSender::class, FirebaseFcmMessageSender::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
