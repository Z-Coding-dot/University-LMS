<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;

final class ApiResponse
{
    public static function data(mixed $data, int $status = 200): JsonResponse
    {
        return response()->json(['data' => $data], $status);
    }

    public static function page(LengthAwarePaginator $page, callable $map): JsonResponse
    {
        return response()->json([
            'data' => $page->getCollection()->map($map)->values(),
            'meta' => ['current_page' => $page->currentPage(), 'per_page' => $page->perPage(), 'total' => $page->total(), 'last_page' => max(1, $page->lastPage())],
        ]);
    }
}
