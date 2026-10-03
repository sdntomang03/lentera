<?php

namespace App\Services;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;
use RuntimeException;

class FirebaseFcmMessageSender implements FcmMessageSender
{
    public function send(array $tokens, string $title, string $body): array
    {
        $credentials = config('services.firebase.credentials');
        if (! is_string($credentials) || $credentials === '' || ! is_file($credentials)) {
            throw new RuntimeException('Firebase Admin SDK credentials are not configured on the server.');
        }

        $messaging = (new Factory)
            ->withServiceAccount($credentials)
            ->createMessaging();

        $report = $messaging->sendMulticast(
            CloudMessage::new()
                ->withNotification(Notification::create($title, $body)),
            $tokens,
        );

        return [
            'successCount' => $report->successes()->count(),
            'failureCount' => $report->failures()->count(),
            'invalidTokens' => $report->invalidTokens(),
        ];
    }
}
