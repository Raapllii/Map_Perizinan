-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jul 28, 2026 at 03:05 AM
-- Server version: 8.4.3
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `map_perizinan`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` bigint UNSIGNED NOT NULL,
  `time` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `time`, `action`, `name`, `status_type`, `created_at`, `updated_at`) VALUES
(1, '09:42', 'Usaha baru terdaftar', 'Toko Maju Bersama', 'new', '2026-07-27 19:01:27', '2026-07-27 19:01:27'),
(2, '09:15', 'Izin diverifikasi', 'CV. Sukses Jaya', 'approved', '2026-07-27 19:01:27', '2026-07-27 19:01:27'),
(3, '08:58', 'Izin kadaluarsa terdeteksi', 'UD. Karya Mandiri', 'expired', '2026-07-27 19:01:27', '2026-07-27 19:01:27'),
(4, '08:30', 'Pengajuan direvisi', 'PT. Mitra Sentosa', 'revision', '2026-07-27 19:01:27', '2026-07-27 19:01:27'),
(5, '08:12', 'Izin ditolak', 'Bengkel Las Putra', 'rejected', '2026-07-27 19:01:27', '2026-07-27 19:01:27'),
(6, '07:45', 'Data usaha diperbarui', 'Apotek Sehat Selalu', 'update', '2026-07-27 19:01:28', '2026-07-27 19:01:28'),
(7, '07:20', 'Usaha baru terdaftar', 'Warung Makan Bu Tini', 'new', '2026-07-27 19:01:28', '2026-07-27 19:01:28');

-- --------------------------------------------------------

--
-- Table structure for table `businesses`
--

CREATE TABLE `businesses` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nib` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `district` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `docs` int NOT NULL DEFAULT '0',
  `lat` decimal(10,8) DEFAULT NULL,
  `lng` decimal(11,8) DEFAULT NULL,
  `color` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `x` int DEFAULT NULL,
  `y` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `businesses`
--

INSERT INTO `businesses` (`id`, `name`, `nib`, `owner`, `district`, `category`, `status`, `date`, `docs`, `lat`, `lng`, `color`, `x`, `y`, `created_at`, `updated_at`) VALUES
(1, 'Toko Maju Bersama', '220512345678', 'Budi Santoso', 'Kecamatan Pusat', 'Perdagangan Umum', 'Aktif', '12 Jan 2025', 0, NULL, NULL, '#2E7D32', 310, 250, '2026-07-27 19:01:26', '2026-07-27 19:01:26'),
(2, 'CV. Sukses Jaya', '220598765432', 'Sari Dewi', 'Kecamatan Utara', 'Jasa & Layanan', 'Aktif', '15 Jan 2025', 0, NULL, NULL, '#2E7D32', 380, 280, '2026-07-27 19:01:26', '2026-07-27 19:01:26'),
(3, 'Warung Makan Bu Sri', '220534521098', 'Sri Mulyani', 'Kecamatan Barat', 'Kuliner & F&B', 'Pending', '18 Jan 2025', 0, NULL, NULL, '#F57F17', 440, 240, '2026-07-27 19:01:27', '2026-07-27 19:01:27'),
(4, 'UD. Karya Mandiri', '220511223344', 'Hendra Wijaya', 'Kecamatan Timur', 'Industri Kecil', 'Kadaluarsa', '20 Jan 2025', 0, NULL, NULL, '#E65100', 420, 310, '2026-07-27 19:01:27', '2026-07-27 19:01:27'),
(5, 'PT. Mitra Sentosa', '220555667788', 'Andi Prasetyo', 'Kecamatan Selatan', 'Perdagangan Umum', 'Aktif', '22 Jan 2025', 0, NULL, NULL, '#2E7D32', 350, 320, '2026-07-27 19:01:27', '2026-07-27 19:01:27'),
(6, 'Bengkel Las Putra', '220599887766', 'Rizky Fauzan', 'Kecamatan Pusat', 'Industri Kecil', 'Ditolak', '25 Jan 2025', 0, NULL, NULL, '#C62828', 360, 360, '2026-07-27 19:01:27', '2026-07-27 19:01:27'),
(7, 'Apotek Sehat Selalu', '220544332211', 'Dewi Kusuma', 'Kecamatan Utara', 'Jasa & Layanan', 'Aktif', '28 Jan 2025', 0, NULL, NULL, '#2E7D32', 210, 90, '2026-07-27 19:01:27', '2026-07-27 19:01:27'),
(8, 'Toko Elektronik Murah', '220566778899', 'Irwan Setiawan', 'Kecamatan Barat', 'Perdagangan Umum', 'Pending', '02 Feb 2025', 0, NULL, NULL, '#2E7D32', 360, 110, '2026-07-27 19:01:27', '2026-07-27 19:01:27'),
(9, 'Rumah Makan Padang', '220588990011', 'Fatimah Zahra', 'Kecamatan Timur', 'Kuliner & F&B', 'Aktif', '05 Feb 2025', 0, NULL, NULL, '#F57F17', 510, 100, '2026-07-27 19:01:27', '2026-07-27 19:01:27'),
(10, 'CV. Jaya Konstruksi', '220522334455', 'Bambang Sutrisno', 'Kecamatan Selatan', 'Properti & Konstruksi', 'Aktif', '08 Feb 2025', 0, NULL, NULL, '#2E7D32', 600, 130, '2026-07-27 19:01:27', '2026-07-27 19:01:27');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` bigint UNSIGNED NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `desc` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total` int NOT NULL DEFAULT '0',
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Aktif',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `code`, `name`, `desc`, `total`, `status`, `created_at`, `updated_at`) VALUES
(1, 'KAT001', 'Perdagangan Umum', 'Toko, kios, dan warung', 892, 'Aktif', '2026-07-27 19:01:26', '2026-07-27 19:01:26'),
(2, 'KAT002', 'Jasa & Layanan', 'Salon, bengkel, laundry', 634, 'Aktif', '2026-07-27 19:01:26', '2026-07-27 19:01:26'),
(3, 'KAT003', 'Kuliner & F&B', 'Restoran, warung makan, kafe', 478, 'Aktif', '2026-07-27 19:01:26', '2026-07-27 19:01:26'),
(4, 'KAT004', 'Industri Kecil', 'Pengolahan dan manufaktur', 312, 'Aktif', '2026-07-27 19:01:26', '2026-07-27 19:01:26'),
(5, 'KAT005', 'Properti & Konstruksi', 'Developer dan kontraktor', 234, 'Aktif', '2026-07-27 19:01:26', '2026-07-27 19:01:26');

-- --------------------------------------------------------

--
-- Table structure for table `districts`
--

CREATE TABLE `districts` (
  `id` bigint UNSIGNED NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `villages` int NOT NULL,
  `area` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `population` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Aktif',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `districts`
--

INSERT INTO `districts` (`id`, `code`, `name`, `villages`, `area`, `population`, `status`, `created_at`, `updated_at`) VALUES
(1, 'KEC001', 'Kecamatan Pusat', 12, '12.4 km²', '125.430', 'Aktif', '2026-07-27 19:01:26', '2026-07-27 19:01:26'),
(2, 'KEC002', 'Kecamatan Utara', 9, '18.7 km²', '98.210', 'Aktif', '2026-07-27 19:01:26', '2026-07-27 19:01:26'),
(3, 'KEC003', 'Kecamatan Barat', 10, '15.2 km²', '112.780', 'Aktif', '2026-07-27 19:01:26', '2026-07-27 19:01:26'),
(4, 'KEC004', 'Kecamatan Timur', 14, '20.1 km²', '143.560', 'Aktif', '2026-07-27 19:01:26', '2026-07-27 19:01:26'),
(5, 'KEC005', 'Kecamatan Selatan', 11, '22.8 km²', '108.920', 'Aktif', '2026-07-27 19:01:26', '2026-07-27 19:01:26');

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint UNSIGNED NOT NULL,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int UNSIGNED NOT NULL,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2014_10_12_000000_create_users_table', 1),
(2, '2014_10_12_100000_create_password_resets_table', 1),
(3, '2019_08_19_000000_create_failed_jobs_table', 1),
(4, '2019_12_14_000001_create_personal_access_tokens_table', 1),
(5, '2026_07_24_022414_create_districts_table', 1),
(6, '2026_07_24_022420_create_categories_table', 1),
(7, '2026_07_24_022422_create_businesses_table', 1),
(8, '2026_07_24_022423_create_activity_logs_table', 1);

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `created_at`, `updated_at`) VALUES
(1, 'App\\Models\\User', 1, 'auth_token', '062b03cbe6e1f26ca039d9b333533a959915e19bb76c82cb47b877c64af86f21', '[\"*\"]', '2026-07-27 19:04:17', '2026-07-27 19:04:05', '2026-07-27 19:04:17');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'User',
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Aktif',
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actions` int NOT NULL DEFAULT '0',
  `last_login` timestamp NULL DEFAULT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `role`, `status`, `avatar`, `actions`, `last_login`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Dr. Andi Kurniawan', 'andi.k@pemkab.go.id', NULL, '$2y$10$iPWpzgTjVQxtm4rWFWusLeumpw82OneDQXjVih5nH4Azqi2cCm6uG', 'Super Admin', 'Aktif', 'AK', 342, NULL, NULL, '2026-07-27 19:01:25', '2026-07-27 19:01:25'),
(2, 'Siti Rahayu, SE', 'siti.r@pemkab.go.id', NULL, '$2y$10$pnYQ0mHQLJeC6Vhlq.KIuO7osY5v1djO2ha5Xflgx1mqOgZqsCUrG', 'Administrator', 'Aktif', 'SR', 218, NULL, NULL, '2026-07-27 19:01:25', '2026-07-27 19:01:25'),
(3, 'Budi Hartono', 'budi.h@pemkab.go.id', NULL, '$2y$10$ilgpD33fr2FK5mEihk.m3em6qHD0C7nfZVCJl.2U6ivn.1LCE9VRq', 'Verifier', 'Aktif', 'BH', 156, NULL, NULL, '2026-07-27 19:01:25', '2026-07-27 19:01:25'),
(4, 'Fitriani Dewi', 'fitri.d@pemkab.go.id', NULL, '$2y$10$vXGz2RaeJWbXX8/yfCibBephyoqqgvKYpBbooWZ54NloozJVYQ1n2', 'Surveyor', 'Aktif', 'FD', 89, NULL, NULL, '2026-07-27 19:01:25', '2026-07-27 19:01:25'),
(5, 'Rahmat Hidayat', 'rahmat.h@pemkab.go.id', NULL, '$2y$10$7RsK7LzMeqI.frgZnWiog.j3JzwEaIVZUFw/zwuUMdKzfMueZ6o66', 'Surveyor', 'Aktif', 'RH', 74, NULL, NULL, '2026-07-27 19:01:25', '2026-07-27 19:01:25'),
(6, 'Putri Anggraini', 'putri.a@pemkab.go.id', NULL, '$2y$10$5UCBVTdjuYGpqwctCZPjsOOI2V74qsRw6QAIR844GJEU3.saoFNDS', 'Verifier', 'Nonaktif', 'PA', 45, NULL, NULL, '2026-07-27 19:01:25', '2026-07-27 19:01:25'),
(7, 'Yusuf Hakim', 'yusuf.h@pemkab.go.id', NULL, '$2y$10$FfuWhkF5.8YsNYKZro5vXu1wdhKhls0IqBMYQGdysjt9dxeeuL2uC', 'Surveyor', 'Aktif', 'YH', 62, NULL, NULL, '2026-07-27 19:01:26', '2026-07-27 19:01:26');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `businesses`
--
ALTER TABLE `businesses`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `categories_code_unique` (`code`);

--
-- Indexes for table `districts`
--
ALTER TABLE `districts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `districts_code_unique` (`code`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD KEY `password_resets_email_index` (`email`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `businesses`
--
ALTER TABLE `businesses`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `districts`
--
ALTER TABLE `districts`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
