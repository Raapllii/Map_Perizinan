<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'status',
        'avatar',
        'actions',
        'last_login',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    /**
     * Check if user is currently active.
     */
    public function isActive(): bool
    {
        return $this->status === 'Aktif';
    }

    /**
     * Check if user has any of the given roles.
     */
    public function hasRole(...$roles): bool
    {
        if (empty($roles)) {
            return false;
        }

        $userRole = strtolower(trim((string) $this->role));
        foreach ($roles as $role) {
            if (is_array($role)) {
                if ($this->hasRole(...$role)) {
                    return true;
                }
            } elseif ($userRole === strtolower(trim((string) $role))) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if user is Super Admin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole('Super Admin');
    }

    /**
     * Check if user is Super Admin or Administrator.
     */
    public function isAdmin(): bool
    {
        return $this->hasRole('Super Admin', 'Administrator');
    }
}
