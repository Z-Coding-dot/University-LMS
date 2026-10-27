<?php
namespace App\Http\Requests;
use App\Enums\{Role, Permission};
use App\Services\Academic\OfferingAccess;
abstract class OfferingMutationRequest extends StrictFormRequest
{
    abstract protected function permission(): Permission;
    public function authorize(): bool
    {
        if ($this->user()->role === Role::Student || ($this->permission() === Permission::TakeAttendance && $this->user()->role !== Role::Teacher)) return false;
        app(OfferingAccess::class)->find($this->user(), (int) $this->route('id'), $this->permission()); return true;
    }
}
