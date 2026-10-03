<?php

namespace App\Services;

interface FcmMessageSender
{
    /**
     * @param  list<string>  $tokens
     * @return array{successCount: int, failureCount: int, invalidTokens: list<string>}
     */
    public function send(array $tokens, string $title, string $body): array;
}
