<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds to provision the main Super Admin account.
     * Idempotent: creates the user if missing, or updates credentials/role if existing.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@dpmptsp.co.id'],
            [
                'name' => 'Super Administrator DPMPTSP',
                'password' => Hash::make('kotasamarinda'),
                'role' => 'Super Admin',
                'status' => 'Aktif',
                'avatar' => 'SA',
                'actions' => 0,
            ]
        );
    }
}

