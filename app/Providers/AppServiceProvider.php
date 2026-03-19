<?php

namespace App\Providers;

use App\Models\Setting;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Force root URL for MAMP subdirectory deployment
        $appUrl = config('app.url');
        if ($appUrl) {
            URL::forceRootUrl($appUrl);
        }

        // Override SMTP config from database settings
        try {
            $mailHost = Setting::getValue('mail_host');
            if ($mailHost) {
                Config::set('mail.mailers.smtp.host', $mailHost);
                Config::set('mail.mailers.smtp.port', Setting::getValue('mail_port', '587'));
                Config::set('mail.mailers.smtp.username', Setting::getValue('mail_username', ''));
                Config::set('mail.mailers.smtp.password', Setting::getValue('mail_password', ''));

                $encryption = Setting::getValue('mail_encryption', 'tls');
                Config::set('mail.mailers.smtp.encryption', $encryption === 'none' ? null : $encryption);

                $fromAddress = Setting::getValue('mail_from_address');
                if ($fromAddress) {
                    Config::set('mail.from.address', $fromAddress);
                }
                $fromName = Setting::getValue('mail_from_name');
                if ($fromName) {
                    Config::set('mail.from.name', $fromName);
                }
            }
        } catch (\Throwable $e) {
            // Table may not exist during first migration
        }
    }
}
