-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Tempo de geração: 11/07/2026 às 00:19
-- Versão do servidor: 11.8.8-MariaDB-log
-- Versão do PHP: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `u789746175_menuplays`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `email` varchar(190) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `admins`
--

INSERT INTO `admins` (`id`, `email`, `password_hash`, `created_at`) VALUES
(1, 'admin@playmenu.app', '$2y$10$ABH7VZU1wq5EifA86qKcgeir/Rug1PEG9CBUxvliq9.f3x2r2B39i', '2026-03-03 01:22:12');

-- --------------------------------------------------------

--
-- Estrutura para tabela `agents`
--

CREATE TABLE `agents` (
  `id` int(11) NOT NULL,
  `name` varchar(190) NOT NULL,
  `email` varchar(190) NOT NULL,
  `email_verified_at` datetime DEFAULT NULL,
  `email_verification_token` varchar(120) DEFAULT NULL,
  `email_verification_sent_at` datetime DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `role` enum('gerente','representante') NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `pix_key` varchar(255) DEFAULT NULL,
  `pix_verified_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `pct_adesao` decimal(5,2) DEFAULT NULL,
  `pct_mensalidade` decimal(5,2) DEFAULT NULL,
  `max_pct_rep` decimal(5,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `agents`
--

INSERT INTO `agents` (`id`, `name`, `email`, `email_verified_at`, `email_verification_token`, `email_verification_sent_at`, `password_hash`, `phone`, `role`, `parent_id`, `pix_key`, `pix_verified_at`, `is_active`, `created_at`, `pct_adesao`, `pct_mensalidade`, `max_pct_rep`) VALUES
(1, 'Luan Mota', 'lula@playmenu.app', NULL, NULL, NULL, '$2y$10$51XdWbzbEKxW4rGUdArRH.15SziY3G3/k/4I1lQle3JNWDVKVUcai', NULL, 'gerente', NULL, NULL, NULL, 1, '2026-06-02 22:25:44', 50.00, 12.00, NULL),
(6, 'Gustavo Lobo', 'gustavolobo@gmail.com', NULL, NULL, NULL, '$2y$10$49.vyZbLGqUa6HjJ7CL8tOxaJbZuM0yCaMEmmuP2tAig5QaK7Krl6', NULL, 'representante', 1, NULL, NULL, 1, '2026-06-12 11:20:54', 45.00, 8.00, NULL),
(7, 'Jonathan Beserra de Mendonça', 'jhonbeserra@hotmail.com', NULL, 'ed272f3a640eb84c9f2ead57c7238f21d19799954152fe45ae1dcb99243d5f49', '2026-06-17 18:45:08', '$2y$10$8cNWiATEHAdanegKasCeNOSzB9d0PBaljgPxf5gSQLAhKQcLA4qOi', NULL, 'representante', NULL, '60770657303', NULL, 1, '2026-06-17 18:45:08', NULL, NULL, NULL),
(8, 'Afrânio de Albuquerque Neto', 'afranioaneto@gmail.com', NULL, '2e50a7328aa24153443414ac6702673c34ab7e375427a9fb4a469169c63ec0a5', '2026-06-18 00:06:26', '$2y$10$IgxX.a3AMgGe6eHWlmmZEeRvKqhZSWWh4QUsXX5.L5e.XYFlj8Zj6', NULL, 'gerente', NULL, 'afranioaneto@gmail.com', NULL, 1, '2026-06-18 00:06:26', NULL, NULL, NULL),
(9, 'THIAGO ALVES BRANDAO', 'thiagoalvesbrandao31@gmail.com', NULL, 'e891dafb639a5775595f264e10ba7ccc52dcd867a4cd7e1ec4e10ff4a61ab276', '2026-06-20 15:38:48', '$2y$10$zxOR0QASEodccyEDGF0RJOEvu8isYipSgQlDF3qknM3QzwVltDP9.', NULL, 'gerente', NULL, '013.826.444-93', NULL, 1, '2026-06-20 15:38:48', NULL, NULL, NULL),
(10, 'Luis Otavio Lima de Sousa', 'luisotaviolimadesousa468@gmail.com', NULL, 'b58840bb1a68eb3550248f00d0f80ae4d471044dd77c62068a32e1d261913fa0', '2026-06-30 00:48:53', '$2y$10$Kiw1.eF6pGtUUPA37sChhuiCSphJWCZX4GZdCEQZKpSraNr4q7.Cq', NULL, 'representante', NULL, '10159191386', NULL, 1, '2026-06-30 00:48:53', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `agent_routes`
--

CREATE TABLE `agent_routes` (
  `id` int(11) NOT NULL,
  `agent_id` int(11) NOT NULL,
  `title` varchar(180) DEFAULT NULL,
  `start_address` varchar(255) DEFAULT NULL,
  `start_lat` decimal(11,8) DEFAULT NULL,
  `start_lng` decimal(11,8) DEFAULT NULL,
  `total_distance_meters` int(11) DEFAULT NULL,
  `total_duration_seconds` int(11) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'planned',
  `rating` tinyint(4) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `completed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `agent_routes`
--

INSERT INTO `agent_routes` (`id`, `agent_id`, `title`, `start_address`, `start_lat`, `start_lng`, `total_distance_meters`, `total_duration_seconds`, `status`, `rating`, `notes`, `created_at`, `completed_at`) VALUES
(3, 1, 'Rota 09/07/2026 23:03', 'Minha localização', -3.85390481, -38.39322161, 7942, 641, 'planned', NULL, NULL, '2026-07-09 23:03:17', NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `agent_route_stops`
--

CREATE TABLE `agent_route_stops` (
  `id` int(11) NOT NULL,
  `route_id` int(11) NOT NULL,
  `place_id` varchar(180) DEFAULT NULL,
  `name` varchar(180) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `lat` decimal(11,8) DEFAULT NULL,
  `lng` decimal(11,8) DEFAULT NULL,
  `phone` varchar(80) DEFAULT NULL,
  `contact_name` varchar(120) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `visit_status` varchar(30) NOT NULL DEFAULT 'pending',
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `agent_route_stops`
--

INSERT INTO `agent_route_stops` (`id`, `route_id`, `place_id`, `name`, `address`, `lat`, `lng`, `phone`, `contact_name`, `notes`, `visit_status`, `sort_order`, `updated_at`) VALUES
(9, 3, 'ChIJmR6ldHNdxwcRpnhpNn3ll3U', 'Beach Pizza - Porto das Dunas', 'Av. Caminho do Sol - Porto das Dunas, Aquiraz - CE, 61700-000, Brasil', -3.85071570, -38.39571120, NULL, NULL, NULL, 'pending', 1, '2026-07-09 23:03:17'),
(10, 3, 'ChIJJ9Z4-nhFxwcR2KVgIG7IIuw', 'Pizzabar', 'Ao lado da borracharia - Av. Caminho do Sol, 250 - Porto das Dunas, Aquiraz - CE, 61700-000, Brasil', -3.84796070, -38.39616180, NULL, NULL, NULL, 'pending', 2, '2026-07-09 23:03:17'),
(11, 3, 'ChIJWV0gVDxdxwcRwbjnnMn7Kfg', '4 Estylo\'s Pizzaria - Porto das Dunas', 'Av. Caminho do Sol - Porto das Dunas, Aquiraz - CE, 61700-000, Brasil', -3.84549770, -38.39808780, NULL, NULL, NULL, 'pending', 3, '2026-07-09 23:03:17'),
(12, 3, 'ChIJaw3NtK9dxwcRwrBt2hKW6wc', 'Pizza Mania', 'R. Leão Marinho, 2090 - Porto das Dunas, Aquiraz - CE, 61700-000, Brasil', -3.84618120, -38.39435860, NULL, NULL, NULL, 'pending', 4, '2026-07-09 23:03:17');

-- --------------------------------------------------------

--
-- Estrutura para tabela `app_settings`
--

CREATE TABLE `app_settings` (
  `setting_key` varchar(120) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `app_settings`
--

INSERT INTO `app_settings` (`setting_key`, `setting_value`, `updated_at`) VALUES
('smtp_from', 'noreply@playmenu.app', '2026-07-06 22:58:37'),
('smtp_from_name', 'PlayMenu', '2026-07-06 22:58:37'),
('smtp_host', 'smtp.hostinger.com', '2026-07-06 22:58:37'),
('smtp_pass', 'Acesso951!', '2026-07-06 22:58:37'),
('smtp_port', '465', '2026-07-06 22:58:37'),
('smtp_secure', 'ssl', '2026-07-06 22:58:37'),
('smtp_user', 'noreply@playmenu.app', '2026-07-06 22:58:37');

-- --------------------------------------------------------

--
-- Estrutura para tabela `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `restaurant_id` int(11) DEFAULT NULL,
  `name` varchar(120) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `categories`
--

INSERT INTO `categories` (`id`, `restaurant_id`, `name`, `sort_order`, `is_active`, `created_at`) VALUES
(4, 1, 'Sanduiches', 2, 1, '2026-03-03 01:50:15'),
(5, 1, 'Entradas', 1, 1, '2026-03-03 01:50:22'),
(6, 1, 'Hamburguers', 3, 1, '2026-03-03 01:50:34'),
(7, 3, 'Entradas', 0, 1, '2026-06-02 22:30:26'),
(8, 7, 'Entradas', 0, 1, '2026-06-03 02:57:19'),
(9, 7, 'Massas', 1, 1, '2026-06-03 02:57:26'),
(10, 7, 'Bebidas', 2, 1, '2026-06-03 02:57:29'),
(11, 7, 'Sobremesa', 3, 1, '2026-06-03 02:57:34'),
(12, 10, 'Entradas', 0, 1, '2026-06-04 20:47:36'),
(13, 12, 'Petiscos', 0, 1, '2026-06-06 16:59:37'),
(14, 12, 'Prato P/ 2 Pessoas', 1, 1, '2026-06-06 17:00:12'),
(16, 12, 'Churrasquinho Na Chapa Acebolado', 3, 1, '2026-06-06 17:01:58'),
(17, 12, 'Prato P/1 Pessoa', 2, 1, '2026-06-06 17:02:22'),
(18, 12, 'Caldos', 4, 1, '2026-06-06 17:03:49'),
(19, 12, 'Porções / Meia', 5, 1, '2026-06-06 17:04:20'),
(20, 12, 'Guranições', 6, 1, '2026-06-06 17:04:51'),
(21, 12, 'Sobremesa', 7, 1, '2026-06-06 17:05:07'),
(23, 12, 'Assados Na Churrasqueira', 8, 1, '2026-06-06 17:06:47'),
(24, 14, 'ENTRADAS', 0, 1, '2026-06-11 00:41:46'),
(25, 14, 'PRATOS PARA COMPARTILHAR', 6, 1, '2026-06-12 01:19:34'),
(26, 14, 'LINGUIÇAS ARTESANAIS', 1, 1, '2026-06-15 11:43:46'),
(27, 14, 'SALADAS', 2, 1, '2026-06-15 11:44:38'),
(28, 14, 'LANCHES', 3, 1, '2026-06-15 11:45:29'),
(29, 14, 'MENU KIDS', 4, 1, '2026-06-15 11:45:45'),
(30, 14, 'DRY AGED STEAKS', 5, 1, '2026-06-15 11:46:18'),
(31, 14, 'CHURRASCO COM ACOMPANHAMENTOS', 7, 1, '2026-06-15 11:47:04'),
(32, 14, 'CORTES BOVINOS', 8, 1, '2026-06-15 11:47:45'),
(33, 14, 'SUÍNO', 9, 1, '2026-06-15 11:47:59'),
(34, 14, 'AVES E PEIXES', 10, 1, '2026-06-15 11:48:18'),
(35, 14, 'RISOTTOS', 11, 1, '2026-06-15 11:48:39'),
(36, 14, 'ACOMPANHAMENTOS', 12, 1, '2026-06-15 11:48:53'),
(37, 14, 'SOBREMESAS', 13, 1, '2026-06-15 11:49:06'),
(38, 14, 'DRINKS CLÁSSICOS E RELEITURAS', 14, 1, '2026-06-15 11:49:24'),
(39, 14, 'DRINKS AUTORAIS', 15, 1, '2026-06-15 11:49:38'),
(40, 14, 'CAIPIRINHAS E CAIPIROSCAS', 16, 1, '2026-06-15 11:49:56'),
(41, 14, 'MULES', 18, 1, '2026-06-15 11:50:08'),
(42, 14, 'GINS COM TÔNICAS & AFINS', 17, 1, '2026-06-15 11:50:22'),
(43, 14, 'DRINK PARA COMPARTILHAR', 19, 1, '2026-06-15 11:50:45'),
(44, 14, 'MOCKTAILS - SEM ALCOOL', 20, 1, '2026-06-15 11:51:01'),
(45, 14, 'DRINKS SEM AÇÚCAR', 21, 1, '2026-06-15 11:51:15'),
(46, 14, 'MOCKTAILS SEM AÇÚCAR', 22, 1, '2026-06-15 11:51:33'),
(47, 14, 'CERVEJAS', 23, 1, '2026-06-15 11:51:44'),
(48, 14, 'CHOPP', 24, 1, '2026-06-15 11:51:56'),
(49, 14, 'WHISKY', 25, 1, '2026-06-15 11:52:07'),
(50, 14, 'DESTILADOS', 26, 1, '2026-06-15 11:52:19'),
(51, 14, 'CACHAÇAS', 27, 1, '2026-06-15 11:52:30'),
(52, 14, 'TEQUILAS EM DOSES', 28, 1, '2026-06-15 11:52:47'),
(53, 14, 'SUCOS NATURAIS', 29, 1, '2026-06-15 11:53:00'),
(54, 14, 'BEBIDAS DIVERSAS', 30, 1, '2026-06-15 11:53:15'),
(55, 14, 'CAFÉS E LICORES', 31, 1, '2026-06-15 11:53:28'),
(56, 15, 'ENTRADAS', 0, 1, '2026-06-16 13:10:40'),
(57, 15, 'PRATO INDIVIDUAL', 1, 1, '2026-06-16 13:11:03'),
(58, 15, 'PRATO COMPARTILHADO', 2, 1, '2026-06-16 13:11:54'),
(59, 15, 'SOBREMESAS', 3, 1, '2026-06-16 13:12:07'),
(60, 15, 'Drinks', 4, 1, '2026-06-16 20:19:20'),
(61, 15, 'Bebidas', 5, 1, '2026-06-16 21:12:51'),
(62, 16, 'COMIDAS', 0, 1, '2026-06-17 12:39:19'),
(63, 16, 'FUNCIONAIS', 3, 1, '2026-06-17 12:39:35'),
(64, 16, 'BEBIDAS', 2, 1, '2026-06-17 12:39:47'),
(65, 16, 'ADICIONAIS', 1, 1, '2026-06-17 12:40:55'),
(66, 16, 'CAFÉ', 4, 1, '2026-06-17 12:41:09'),
(67, 18, 'PETISCOS', 1, 1, '2026-06-23 20:38:16'),
(68, 18, 'PRATO P/ 2', 3, 1, '2026-06-23 20:39:03'),
(69, 18, 'PRATO INDIVIDUAL', 2, 1, '2026-06-23 20:39:39'),
(70, 18, 'CHURRASQUINHO NA CHAPA', 4, 1, '2026-06-23 20:39:59'),
(71, 18, 'CALDOS', 5, 1, '2026-06-23 20:40:06'),
(72, 18, 'PORÇÕES 1/2', 6, 1, '2026-06-23 20:41:22'),
(73, 18, 'GUARNIÇÕES', 7, 1, '2026-06-23 20:41:42'),
(74, 18, 'SOBREMESAS', 8, 1, '2026-06-23 20:41:57'),
(75, 18, 'ASSADOS CHURRASQUEIRA', 9, 1, '2026-06-23 20:42:57'),
(76, 18, 'CERVEJAS', 10, 1, '2026-06-23 20:44:44'),
(77, 18, 'BEBIDAS DISVERSAS', 11, 1, '2026-06-23 20:44:57'),
(78, 18, 'ROSCAS', 12, 1, '2026-06-23 20:46:43'),
(79, 18, 'WHISKY', 13, 1, '2026-06-23 20:47:21'),
(80, 18, 'LICORES', 14, 1, '2026-06-23 20:47:43'),
(81, 18, 'DESTILADAS', 15, 1, '2026-06-23 20:48:08'),
(82, 18, 'SUCOS', 16, 1, '2026-06-23 20:48:23'),
(83, 18, 'DRINKS', 17, 1, '2026-06-23 20:48:35'),
(84, 18, 'COMBOS  DO BAIANO', 18, 1, '2026-06-23 20:48:56');

-- --------------------------------------------------------

--
-- Estrutura para tabela `commissions`
--

CREATE TABLE `commissions` (
  `id` int(11) NOT NULL,
  `agent_id` int(11) NOT NULL,
  `source_payment_id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `kind` enum('adesao','mensalidade','override_adesao','override_mensalidade') NOT NULL,
  `base_cents` int(11) NOT NULL,
  `pct` decimal(5,2) NOT NULL,
  `amount_cents` int(11) NOT NULL,
  `available_at` datetime DEFAULT NULL,
  `status` enum('available','withdrawn') NOT NULL DEFAULT 'available',
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `commission_rules`
--

CREATE TABLE `commission_rules` (
  `id` int(11) NOT NULL,
  `min_active_clients` int(11) NOT NULL DEFAULT 0,
  `pct_adesao` decimal(5,2) NOT NULL DEFAULT 10.00,
  `pct_mensalidade` decimal(5,2) NOT NULL DEFAULT 10.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `commission_rules`
--

INSERT INTO `commission_rules` (`id`, `min_active_clients`, `pct_adesao`, `pct_mensalidade`) VALUES
(1, 0, 10.00, 10.00),
(2, 75, 50.00, 17.00),
(3, 150, 50.00, 22.00);

-- --------------------------------------------------------

--
-- Estrutura para tabela `menu_analytics_events`
--

CREATE TABLE `menu_analytics_events` (
  `id` bigint(20) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `event_type` varchar(40) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `link_type` varchar(60) DEFAULT NULL,
  `link_label` varchar(180) DEFAULT NULL,
  `visitor_id` varchar(64) DEFAULT NULL,
  `ip_hash` char(64) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `referrer` varchar(500) DEFAULT NULL,
  `page_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `menu_analytics_events`
--

INSERT INTO `menu_analytics_events` (`id`, `restaurant_id`, `event_type`, `product_id`, `link_type`, `link_label`, `visitor_id`, `ip_hash`, `user_agent`, `referrer`, `page_url`, `created_at`) VALUES
(1, 15, 'menu_view', NULL, NULL, NULL, '2705d94c19f0bb0b4f2a40a3d1d9bc8c', '4f815a9f4818a5a46cf87cdb64f99d8a44e120b3069227d047b42564bbf9804b', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'playmenu.app/public/index.php?r=modelo1', '2026-07-09 21:53:04'),
(2, 15, 'menu_view', NULL, NULL, NULL, '2705d94c19f0bb0b4f2a40a3d1d9bc8c', '4f815a9f4818a5a46cf87cdb64f99d8a44e120b3069227d047b42564bbf9804b', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'playmenu.app/public/index.php?r=modelo1', '2026-07-09 21:53:12'),
(3, 15, 'menu_view', NULL, NULL, NULL, '2705d94c19f0bb0b4f2a40a3d1d9bc8c', '4f815a9f4818a5a46cf87cdb64f99d8a44e120b3069227d047b42564bbf9804b', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'https://playmenu.app/public/index.php?r=modelo1', 'playmenu.app/public/index.php?r=modelo1&cat=56&q=', '2026-07-09 21:54:13'),
(4, 15, 'menu_view', NULL, NULL, NULL, '2705d94c19f0bb0b4f2a40a3d1d9bc8c', '4f815a9f4818a5a46cf87cdb64f99d8a44e120b3069227d047b42564bbf9804b', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'https://playmenu.app/public/index.php?r=modelo1&cat=56&q=', 'playmenu.app/public/index.php?r=modelo1&q=', '2026-07-09 21:54:54'),
(5, 15, 'menu_view', NULL, NULL, NULL, '2705d94c19f0bb0b4f2a40a3d1d9bc8c', '4f815a9f4818a5a46cf87cdb64f99d8a44e120b3069227d047b42564bbf9804b', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'playmenu.app/public/index.php?r=modelo1', '2026-07-09 21:55:38'),
(6, 15, 'menu_view', NULL, NULL, NULL, '2705d94c19f0bb0b4f2a40a3d1d9bc8c', '4f815a9f4818a5a46cf87cdb64f99d8a44e120b3069227d047b42564bbf9804b', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'playmenu.app/public/index.php?r=modelo1', '2026-07-09 21:58:25'),
(7, 15, 'menu_view', NULL, NULL, NULL, '2705d94c19f0bb0b4f2a40a3d1d9bc8c', '4f815a9f4818a5a46cf87cdb64f99d8a44e120b3069227d047b42564bbf9804b', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'playmenu.app/public/index.php?r=modelo1', '2026-07-09 21:58:30'),
(8, 15, 'menu_view', NULL, NULL, NULL, '2705d94c19f0bb0b4f2a40a3d1d9bc8c', '4f815a9f4818a5a46cf87cdb64f99d8a44e120b3069227d047b42564bbf9804b', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'playmenu.app/public/index.php?r=modelo1', '2026-07-09 21:59:09'),
(9, 15, 'link_click', NULL, 'ifood', 'iFood', '2705d94c19f0bb0b4f2a40a3d1d9bc8c', '4f815a9f4818a5a46cf87cdb64f99d8a44e120b3069227d047b42564bbf9804b', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'https://playmenu.app/public/index.php?r=modelo1', 'playmenu.app/public/analytics_track.php', '2026-07-09 21:59:16'),
(10, 15, 'menu_view', NULL, NULL, NULL, '2705d94c19f0bb0b4f2a40a3d1d9bc8c', '4f815a9f4818a5a46cf87cdb64f99d8a44e120b3069227d047b42564bbf9804b', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'playmenu.app/public/index.php?r=modelo1', '2026-07-09 22:00:07'),
(11, 15, 'link_click', NULL, 'whatsapp', 'WhatsApp', '2705d94c19f0bb0b4f2a40a3d1d9bc8c', '4f815a9f4818a5a46cf87cdb64f99d8a44e120b3069227d047b42564bbf9804b', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'https://playmenu.app/public/index.php?r=modelo1', 'playmenu.app/public/analytics_track.php', '2026-07-09 22:00:10'),
(12, 15, 'link_click', NULL, 'instagram', 'Instagram', '2705d94c19f0bb0b4f2a40a3d1d9bc8c', '4f815a9f4818a5a46cf87cdb64f99d8a44e120b3069227d047b42564bbf9804b', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'https://playmenu.app/public/index.php?r=modelo1', 'playmenu.app/public/analytics_track.php', '2026-07-09 22:00:22'),
(13, 15, 'link_click', NULL, 'whatsapp', 'WhatsApp', '2705d94c19f0bb0b4f2a40a3d1d9bc8c', '4f815a9f4818a5a46cf87cdb64f99d8a44e120b3069227d047b42564bbf9804b', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'https://playmenu.app/public/index.php?r=modelo1', 'playmenu.app/public/analytics_track.php', '2026-07-09 22:00:34'),
(14, 15, 'menu_view', NULL, NULL, NULL, '2705d94c19f0bb0b4f2a40a3d1d9bc8c', '4f815a9f4818a5a46cf87cdb64f99d8a44e120b3069227d047b42564bbf9804b', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'playmenu.app/public/index.php?r=modelo1', '2026-07-09 22:14:10'),
(15, 15, 'menu_view', NULL, NULL, NULL, '2705d94c19f0bb0b4f2a40a3d1d9bc8c', '4f815a9f4818a5a46cf87cdb64f99d8a44e120b3069227d047b42564bbf9804b', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'playmenu.app/public/index.php?r=modelo1', '2026-07-09 22:15:21'),
(16, 15, 'link_click', NULL, 'whatsapp', 'WhatsApp', '2705d94c19f0bb0b4f2a40a3d1d9bc8c', '4f815a9f4818a5a46cf87cdb64f99d8a44e120b3069227d047b42564bbf9804b', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'https://playmenu.app/public/index.php?r=modelo1', 'playmenu.app/public/analytics_track.php', '2026-07-09 22:16:00'),
(17, 15, 'menu_view', NULL, NULL, NULL, '99e08e4be29dfdee837fbec784a26b13', '5660fa3e7b9a81216ec87ccdc5a5d8834b75ddbd96b50fd4a7a432aea2173501', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.7871.51 Mobile/15E148 Safari/604.1', 'https://playmenu.app/public/index.php?r=modelo1&from=admin', 'playmenu.app/public/index.php?r=modelo1&cat=56&q=', '2026-07-09 23:33:06'),
(18, 15, 'menu_view', NULL, NULL, NULL, '99e08e4be29dfdee837fbec784a26b13', '5660fa3e7b9a81216ec87ccdc5a5d8834b75ddbd96b50fd4a7a432aea2173501', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.7871.51 Mobile/15E148 Safari/604.1', 'https://playmenu.app/public/index.php?r=modelo1&cat=56&q=', 'playmenu.app/public/index.php?r=modelo1&cat=57&q=', '2026-07-09 23:33:10'),
(19, 15, 'product_view', 38, NULL, NULL, '99e08e4be29dfdee837fbec784a26b13', '5660fa3e7b9a81216ec87ccdc5a5d8834b75ddbd96b50fd4a7a432aea2173501', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.7871.51 Mobile/15E148 Safari/604.1', 'https://playmenu.app/public/index.php?r=modelo1&cat=57&q=', 'playmenu.app/public/analytics_track.php', '2026-07-09 23:33:12'),
(20, 15, 'menu_view', NULL, NULL, NULL, '2705d94c19f0bb0b4f2a40a3d1d9bc8c', '4f815a9f4818a5a46cf87cdb64f99d8a44e120b3069227d047b42564bbf9804b', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'playmenu.app/public/?r=modelo1', '2026-07-10 19:05:09'),
(21, 15, 'menu_view', NULL, NULL, NULL, '99aaae4e74c0a097fd7445d503d91cfd', '4f815a9f4818a5a46cf87cdb64f99d8a44e120b3069227d047b42564bbf9804b', 'WhatsApp/2.2623.103 W', NULL, 'playmenu.app/public/?r=modelo1', '2026-07-10 19:05:13'),
(22, 15, 'menu_view', NULL, NULL, NULL, '65310176dd32494fd045546372d67736', '15cf12dfc37b10e31e8956b8bbc4ea3fafb6019e9cddd92038ae1f386051f20a', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3.1 Mobile/15E148 Safari/604.1', NULL, 'playmenu.app/public/?r=modelo1', '2026-07-10 19:05:18'),
(23, 15, 'menu_view', NULL, NULL, NULL, '2705d94c19f0bb0b4f2a40a3d1d9bc8c', '4f815a9f4818a5a46cf87cdb64f99d8a44e120b3069227d047b42564bbf9804b', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'playmenu.app/public/?r=modelo1', '2026-07-10 20:17:30'),
(24, 15, 'menu_view', NULL, NULL, NULL, '65310176dd32494fd045546372d67736', '4f815a9f4818a5a46cf87cdb64f99d8a44e120b3069227d047b42564bbf9804b', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3.1 Mobile/15E148 Safari/604.1', NULL, 'playmenu.app/public/index.php?r=modelo1', '2026-07-10 21:08:38'),
(25, 15, 'product_view', 35, NULL, NULL, '65310176dd32494fd045546372d67736', '4f815a9f4818a5a46cf87cdb64f99d8a44e120b3069227d047b42564bbf9804b', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3.1 Mobile/15E148 Safari/604.1', 'https://playmenu.app/public/index.php?r=modelo1', 'playmenu.app/public/analytics_track.php', '2026-07-10 21:08:45'),
(26, 18, 'menu_view', NULL, NULL, NULL, 'b6aa9c0b54c03e2653a3df09e47a72e7', '4f815a9f4818a5a46cf87cdb64f99d8a44e120b3069227d047b42564bbf9804b', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1', 'https://playmenu.app/public/index.php?r=buteco-do-baiano&from=admin', 'playmenu.app/public/index.php?r=buteco-do-baiano&cat=67&q=', '2026-07-11 00:00:57'),
(27, 18, 'menu_view', NULL, NULL, NULL, 'b6aa9c0b54c03e2653a3df09e47a72e7', '4f815a9f4818a5a46cf87cdb64f99d8a44e120b3069227d047b42564bbf9804b', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1', 'https://playmenu.app/public/index.php?r=buteco-do-baiano&cat=67&q=', 'playmenu.app/public/index.php?r=buteco-do-baiano&cat=69&q=', '2026-07-11 00:00:59'),
(28, 18, 'menu_view', NULL, NULL, NULL, 'b6aa9c0b54c03e2653a3df09e47a72e7', '4f815a9f4818a5a46cf87cdb64f99d8a44e120b3069227d047b42564bbf9804b', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1', 'https://playmenu.app/public/index.php?r=buteco-do-baiano&cat=69&q=', 'playmenu.app/public/index.php?r=buteco-do-baiano&q=', '2026-07-11 00:01:03'),
(29, 15, 'menu_view', NULL, NULL, NULL, 'b6aa9c0b54c03e2653a3df09e47a72e7', '4f815a9f4818a5a46cf87cdb64f99d8a44e120b3069227d047b42564bbf9804b', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1', 'https://playmenu.app/public/index.php?r=modelo1&from=admin', 'playmenu.app/public/index.php?r=modelo1&cat=56&q=', '2026-07-11 00:01:59');

-- --------------------------------------------------------

--
-- Estrutura para tabela `password_resets`
--

CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL,
  `account_type` varchar(30) NOT NULL,
  `account_id` int(11) NOT NULL,
  `email` varchar(190) NOT NULL,
  `code_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `attempts` tinyint(4) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `password_resets`
--

INSERT INTO `password_resets` (`id`, `account_type`, `account_id`, `email`, `code_hash`, `expires_at`, `used_at`, `attempts`, `created_at`) VALUES
(1, 'restaurant', 15, 'alanvictordsg@gmail.com', '$2y$10$oamu5GU0RTlezDgbneMVwu3HUbE.q3iIN78NcP5XysyHykD4OWBji', '2026-07-06 23:09:16', '2026-07-06 22:54:52', 0, '2026-07-06 22:54:16'),
(2, 'restaurant', 15, 'alanvictordsg@gmail.com', '$2y$10$Qhxyii71y38MwXFcElub1OBhKRg5NymjV4YNkI79KGL9JF8Crpct6', '2026-07-06 23:14:16', '2026-07-06 22:59:43', 0, '2026-07-06 22:59:16'),
(3, 'agent', 1, 'lula@playmenu.app', '$2y$10$yMFAT2OqlzOoSzFRJx4S3.nHxiqoL8MyJ1Wi0Taqmj.apju.02An6', '2026-07-09 22:34:51', '2026-07-09 22:20:19', 0, '2026-07-09 22:19:51');

-- --------------------------------------------------------

--
-- Estrutura para tabela `plans`
--

CREATE TABLE `plans` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `price_cents` int(11) NOT NULL DEFAULT 0,
  `discount_type` varchar(20) NOT NULL DEFAULT 'none',
  `discount_percent` decimal(6,2) NOT NULL DEFAULT 0.00,
  `discount_value_cents` int(11) NOT NULL DEFAULT 0,
  `periodicity_days` int(11) NOT NULL DEFAULT 30 COMMENT '30=mensal, 180=semestral, 365=anual',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `plans`
--

INSERT INTO `plans` (`id`, `name`, `description`, `price_cents`, `discount_type`, `discount_percent`, `discount_value_cents`, `periodicity_days`, `is_active`, `created_at`) VALUES
(1, 'Mensal MenuPlay', 'Plano mensal padrão', 14700, 'none', 0.00, 0, 30, 1, '2026-06-04 21:05:07'),
(2, 'Semestral Playmenu', '20% desconto \r\nR$: 176,40', 70560, 'none', 0.00, 0, 180, 1, '2026-06-04 21:23:50'),
(3, 'Anual Playmenu', '35% desconto \r\nR$: 617,40', 114660, 'none', 0.00, 0, 365, 1, '2026-06-04 21:24:03');

-- --------------------------------------------------------

--
-- Estrutura para tabela `platform_settings`
--

CREATE TABLE `platform_settings` (
  `id` int(11) NOT NULL DEFAULT 1,
  `adesao_cents` int(11) NOT NULL DEFAULT 29900,
  `mensalidade_cents` int(11) NOT NULL DEFAULT 9900,
  `video_price_cents` int(11) NOT NULL DEFAULT 4900,
  `min_withdrawal_cents` int(11) NOT NULL DEFAULT 5000,
  `override_pct_adesao` decimal(5,2) NOT NULL DEFAULT 5.00,
  `override_pct_mensalidade` decimal(5,2) NOT NULL DEFAULT 5.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `platform_settings`
--

INSERT INTO `platform_settings` (`id`, `adesao_cents`, `mensalidade_cents`, `video_price_cents`, `min_withdrawal_cents`, `override_pct_adesao`, `override_pct_mensalidade`) VALUES
(1, 29900, 14700, 399, 5000, 50.00, 10.00);

-- --------------------------------------------------------

--
-- Estrutura para tabela `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `restaurant_id` int(11) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `title` varchar(190) NOT NULL,
  `description` text DEFAULT NULL,
  `allergens` varchar(255) DEFAULT NULL,
  `price_cents` int(11) NOT NULL DEFAULT 0,
  `thumb_image` varchar(255) DEFAULT NULL,
  `video_file` varchar(255) DEFAULT NULL,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `featured_label` varchar(80) DEFAULT 'Mais pedido hoje',
  `featured_icon` varchar(20) DEFAULT '?',
  `prep_minutes` int(11) DEFAULT NULL,
  `popularity` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `ar_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `ar_model_file` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `products`
--

INSERT INTO `products` (`id`, `restaurant_id`, `category_id`, `title`, `description`, `allergens`, `price_cents`, `thumb_image`, `video_file`, `is_featured`, `featured_label`, `featured_icon`, `prep_minutes`, `popularity`, `is_active`, `sort_order`, `ar_enabled`, `ar_model_file`, `created_at`) VALUES
(3, 1, 5, 'Panceta', '300g de panceta bestaferamente no ponto de pururuca 300g de panceta bestaferamente no ponto de pururuca 300g de panceta bestaferamente no ponto de pururuca 300g de panceta bestaferamente no ponto de pururuca', NULL, 3900, 'thumbs/46b3c29d0a028a375b253fb7.webp', 'videos/4a027a50e804f62aed2f671f.mp4', 1, 'Mais pedido', '🔥', NULL, NULL, 1, 0, 0, NULL, '2026-03-03 01:57:06'),
(5, 1, 5, 'Barra de Torresmo Duroc', 'Crocância que conquista! Nossa barra de torresmo é feita com barriga de porco cuidadosamente preparada para alcançar o ponto perfeito. Ideal para acompanhar uma cerveja bem gelada ou aquele momento de puro prazer gastronômico.', NULL, 439000, 'thumbs/0af2e1f2772ed9ca5cfd5bb5.jpg', 'videos/d69d50c0e8c26fc7e1706804.mp4', 0, 'Mais pedido hoje', '🔥', NULL, NULL, 1, 2, 0, NULL, '2026-05-29 08:11:19'),
(6, 1, 5, 'Bolinho de Carne', 'O \"Close\" Crocante: Grave um vídeo bem aproximado partindo o bolinho ao meio com as mãos. Foque na fumaça saindo e no contraste entre a casquinha crocante por fora e a carne suculenta por dentro.', NULL, 3990, 'thumbs/6291b2efe2b4e66399be0957.jpg', 'videos/6e318c1cb85fd64c50997896.mp4', 0, 'Mais pedido hoje', '🔥', NULL, NULL, 1, 3, 0, NULL, '2026-05-29 22:36:38'),
(7, 7, 8, 'Pastel de Carne', 'Porção de pastel de carne', NULL, 2990, 'thumbs/1235a8437baa6ac3c8c91a7d.png', 'videos/ad9e21dd1b2685adb277b339.mp4', 1, 'Mais pedido hoje', '🔥', 15, NULL, 1, 0, 1, 'models3d/2f514e4a42a8c1ba5f7e9a32.glb', '2026-06-03 03:03:27'),
(8, 14, 24, 'Carpaccio de maminha curada', 'Dijon, molho gorgonzola, redução de balsâmico, alcaparras , acompanha torradinhas de pão de batata com tomilho.\r\nCom Glúten - Com Lactose - Com Leite', NULL, 6900, 'thumbs/cc301f4f722cf460db4fd8ef.jpeg', NULL, 0, 'Mais pedido hoje', '🔥', NULL, NULL, 1, 0, 0, NULL, '2026-06-10 18:26:19'),
(9, 14, 24, 'Barriga de porco à pururuca - 300g', 'Servida com calda de laranja picante.', NULL, 5900, 'thumbs/22a97284c670f5dd67bb5cc9.jpeg', NULL, 0, 'Mais pedido hoje', '🔥', NULL, NULL, 1, 1, 0, NULL, '2026-06-10 18:27:35'),
(10, 14, 24, 'Croquete de Ossobuco', 'Feito com carne bovina cozida lentamente, acompanhado com molho de tutano. (4UND)\r\n Com Glúten -  Com Ovo -  Com Soja -  Com Corantes', NULL, 4700, 'thumbs/637b691b03d5c9760b257ab0.jpeg', NULL, 0, '', '', NULL, NULL, 1, 2, 0, NULL, '2026-06-10 18:29:37'),
(11, 14, 24, 'Pão de alho \"do Parrileiro\"', 'Feito com baguete artesanal e um creme de alho com queijo.\r\n Com Glúten - Com Lactose -  Com Leite - Com Ovo', NULL, 2500, 'thumbs/be255d9d80a976aaea624509.jpeg', 'videos/2419c90c2ab8c219ce857f1f.mp4', 0, '', '', NULL, NULL, 1, 3, 0, NULL, '2026-06-10 18:31:40'),
(12, 14, 24, 'Bananinha suína - 200g', 'Corte retirado da costela suína, feito no espeto e servido com abacaxi grelhado.\r\n\r\nCom Corantes', NULL, 3900, 'thumbs/83ecc1f57c7b1e18a8ee4426.jpeg', NULL, 0, '', '', NULL, NULL, 1, 4, 0, NULL, '2026-06-10 18:33:51'),
(13, 14, 24, 'Coração de frango - 250g', 'Preparado em marinada especial da casa', NULL, 4500, 'thumbs/237ca32f99603230e3736b31.jpeg', NULL, 0, '', '', NULL, NULL, 1, 5, 0, NULL, '2026-06-10 18:35:44'),
(14, 14, 24, 'Batata da casa', 'Ao azeite trufado e parmesão\r\n\r\nCom Lactose', NULL, 4900, 'thumbs/cf812b5174409023434c8482.jpeg', NULL, 0, '', '🔥', NULL, NULL, 1, 0, 0, NULL, '2026-06-10 18:41:24'),
(15, 14, 24, 'Filé pimenta', 'Filé mignon curado com pimenta do reino ao molho secreto e fritas da casa\r\n\r\nCom Lactose', NULL, 8900, 'thumbs/58bbeb9409a1396598b75171.jpeg', NULL, 0, 'Mais pedido hoje', '🔥', NULL, NULL, 1, 0, 0, NULL, '2026-06-10 18:43:55'),
(16, 14, 25, 'Ancho do Parrileiro 500g', 'Grelhado e glaceado ao roti de tutano e mel, com gnocchi de mandioquinha com creme de cebola e parmesão\r\n Com Glúten - Com Lactose - Com Leite', NULL, 18900, 'thumbs/730b04255cbe45c99298a6d9.jpeg', NULL, 0, 'Mais pedido hoje', '🔥', NULL, NULL, 1, 0, 0, NULL, '2026-06-10 18:49:05'),
(17, 14, 25, 'Parmegiana de mignon - 400g', 'Filé mignon empanado e frito por imersão, gratinado com muçarela e molho de tomate da casa. Servido com fettuccine e fonduta de parmesão.\r\n Com Glúten - Com Lactose - Com Leite - Com Ovo - Com Soja', NULL, 17500, 'thumbs/aca862dd93b45eabd8a424d6.jpeg', 'videos/2419c90c2ab8c219ce857f1f.mp4', 0, 'Mais pedido hoje', '🔥', NULL, NULL, 1, 0, 0, NULL, '2026-06-10 18:51:16'),
(18, 14, 25, 'Sirigado do Parrileiro 400g', 'Sirigado ao molho de manteiga, ervas e alcaparras, batata brava e arroz cremoso', NULL, 19000, 'thumbs/d0695117efdbde383b5690e4.jpeg', 'videos/2419c90c2ab8c219ce857f1f.mp4', 0, 'Mais pedido hoje', '🔥', NULL, NULL, 1, 0, 0, NULL, '2026-06-10 18:52:54'),
(19, 14, 24, 'Bruschetta de picanha', 'Pão italiano de fermentação natural, toque suave de alho, tomate assado, catupiry, queijo coalho, lâmina de picanha mal passada, manjericão, azeite defumado e um toque de flor de sal.', NULL, 6700, 'thumbs/35ab6f99c2d45d88d01ebd1d.webp', NULL, 0, '', '🔥', NULL, NULL, 1, 0, 0, NULL, '2026-06-15 11:55:10'),
(20, 14, 26, 'Linguiça de dry aged - 200g', 'Feita com carne bovina maturada por 60 dias', NULL, 4500, 'thumbs/dbb12d360eba93318dc7ae8f.webp', NULL, 0, '', '', NULL, NULL, 1, 0, 0, NULL, '2026-06-15 12:02:02'),
(21, 14, 26, 'Toscana - 200G', '', NULL, 3300, 'thumbs/1af177e587a8d1ffea9479e2.webp', NULL, 0, '', '', NULL, NULL, 1, 1, 0, NULL, '2026-06-15 12:03:06'),
(22, 14, 26, 'Pimenta jalepeño - 200g', '', NULL, 3800, 'thumbs/bbe67b4cef2df2e10c9e042b.webp', NULL, 0, '', '', NULL, NULL, 1, 2, 0, NULL, '2026-06-15 12:04:01'),
(23, 14, 26, 'Cuiabana suína com queijo 200g', '', NULL, 4200, 'thumbs/ccba471cb8607a28fa06548d.webp', NULL, 0, '', '', NULL, NULL, 1, 3, 0, NULL, '2026-06-15 12:05:09'),
(24, 14, 26, 'Cordeiro - 200g', '', NULL, 4200, 'thumbs/470f6a56cf5ce20f20cb1d26.webp', NULL, 0, '', '', NULL, NULL, 1, 4, 0, NULL, '2026-06-15 12:06:00'),
(25, 14, 27, 'Salada para churrasco', 'Alface Americana, Molho da casa, Parmesão, Cebola Roxa e Croutons', NULL, 4000, 'thumbs/98a8f431616939069f624a60.webp', NULL, 0, '', '', NULL, NULL, 1, 0, 0, NULL, '2026-06-15 12:07:29'),
(26, 14, 27, 'Salada smoked caesar', 'Alface americana com peito de frango defumado molho Caesar, tomate seco, croutons, bacon, parmesão e salsa.', NULL, 4600, 'thumbs/8d0b74f4f41eb1ce4819d85d.webp', NULL, 0, '', '', NULL, NULL, 1, 1, 0, NULL, '2026-06-15 12:10:20'),
(27, 14, 28, 'Burguer Parrileiro', 'Burger com blend de carnes da casa, pão brioche com gergelim, cebola caramelizada, bacon artesanal, maionese e queijo prato.', NULL, 4400, 'thumbs/365d6cd531307678e16cb8dc.webp', NULL, 0, '', '', NULL, NULL, 1, 0, 0, NULL, '2026-06-15 12:12:38'),
(28, 14, 28, 'Burguer Parrileiro + Batata', 'Burger com blend de carnes da casa, pão brioche com gergelim, cebola caramelizada, bacon artesanal, maionese e queijo prato mais porção de batata frita', NULL, 4800, 'thumbs/cf560990057b8ccf8d44cabb.webp', NULL, 0, 'Mais pedido hoje', '🔥', NULL, NULL, 1, 1, 0, NULL, '2026-06-15 12:14:02'),
(29, 14, 28, 'Burguer Parrileiro + Batata', 'Burger com blend de carnes da casa, pão brioche com gergelim, cebola caramelizada, bacon artesanal, maionese e queijo prato mais porção de batata frita', NULL, 4800, NULL, NULL, 0, '', '', NULL, NULL, 1, 1, 0, NULL, '2026-06-15 12:14:13'),
(30, 14, 29, 'Franguinho na Brasa', 'Escolha duas guarnições: \r\n Arroz Branco | Arroz de Brócolis | Linguine | Purê de Batata | Legumes na Brasa | Fritas', NULL, 3900, 'thumbs/390746f9a7524afeee5eeb22.webp', NULL, 0, '', '', NULL, NULL, 1, 0, 0, NULL, '2026-06-15 13:12:31'),
(31, 14, 29, 'Escalope de fraldinha', 'Escalope de fraldinha', NULL, 0, 'thumbs/85fb738daa1ad92db6073b76.webp', NULL, 0, '', '', NULL, NULL, 1, 1, 0, NULL, '2026-06-15 13:13:22'),
(32, 14, 29, 'Soda kids - beli', 'Monin de Morango, limão e água com gás', NULL, 990, 'thumbs/fed8e57148d5278db835782a.webp', NULL, 0, '', '', NULL, NULL, 1, 2, 0, NULL, '2026-06-15 13:14:52'),
(33, 14, 29, 'Soda kids - pomi', 'Monin de Maçã Verde, limão e água com gás.', NULL, 990, 'thumbs/3112b8adbd63affc1205a2d9.webp', NULL, 0, '', '', NULL, NULL, 1, 3, 0, NULL, '2026-06-15 13:15:54'),
(34, 14, 29, 'Soda kids - manda', 'Monin de Tangerina, limão e água com gás.', NULL, 990, 'thumbs/9b357fe00665abc3cb1cc04a.webp', NULL, 0, '', '', NULL, NULL, 1, 4, 0, NULL, '2026-06-15 13:17:00'),
(35, 15, 56, 'Pastel da Casa', 'Porção com quatro unidades de pastel de queijo artesanal crocante, acompanhada de geleia de pimenta levemente picante.', NULL, 3400, 'thumbs/b4edc710c56ceb5fad9f03f2.png', 'videos/f114d5f3a05a59c32a86e668.mp4', 0, '', '', NULL, NULL, 1, 0, 0, NULL, '2026-06-16 14:53:44'),
(36, 15, 56, 'Croqueta da Terra', 'Croquete cremoso de cogumelos nativos com queijo coalho maçaricado e geleia artesanal de pimenta defumada.', NULL, 3800, 'thumbs/f8cc57ae52a5e2008f94cb23.jpeg', 'videos/8bf91d9a06cee113dc556c2f.mov', 0, '', '', NULL, NULL, 1, 1, 0, NULL, '2026-06-16 14:54:33'),
(37, 15, 56, 'Ceviche Tropical', 'Peixe branco fresco marinado no limão galego com cubos de manga, cebola roxa e leite de tigre de cajá.', NULL, 4400, 'thumbs/e685cde17d4af04877d7477a.png', 'videos/3e64f795cfebcf26dfb23b61.mp4', 0, '', '', NULL, NULL, 1, 2, 0, NULL, '2026-06-16 14:56:07'),
(38, 15, 57, 'Nhoque Modelo', 'Nhoque artesanal de batata-doce roxa ao molho de queijo regional, finalizado com castanhas tostadas e brotos orgânicos.', NULL, 6800, 'thumbs/e38839eb54ece723f1205c7b.png', 'videos/0568d5490333651f32bb6ac4.mov', 0, '', '', NULL, NULL, 1, 0, 0, NULL, '2026-06-16 14:59:22'),
(39, 15, 57, 'Pescado ao Mar', 'Filé de peixe grelhado na brasa sobre purê de banana-da-terra, molho de leite de coco com capim-santo e farofa de dendê.', NULL, 8400, 'thumbs/aec0545df233111c37cc92ff.png', 'videos/a3a6af8fd6feb59f3612555f.mp4', 0, '', '', NULL, NULL, 1, 1, 0, NULL, '2026-06-16 15:00:06'),
(40, 15, 57, 'Filé do Casarão', 'Medalhão de filé mignon grelhado na manteiga de garrafa, servido com aligot de macaxeira e redução de vinho do Porto com rapadura.', NULL, 8200, 'thumbs/72466283a5986c296573d99b.png', 'videos/fb54e8269b86ff6275020c5b.mp4', 0, '', '', NULL, NULL, 1, 2, 0, NULL, '2026-06-16 15:01:20'),
(41, 15, 58, 'Arroz de Costela', 'Arroz caldoso com costela desfiada, linguiça da casa, ovo perfeito, aioli de alho assado e chips crocantes de cebola.', NULL, 14500, 'thumbs/360d91ade50d436460891421.png', 'videos/f4560969e25d8438e224b1ac.mov', 0, '', '', NULL, NULL, 1, 0, 0, NULL, '2026-06-16 15:02:28'),
(42, 15, 58, 'Moqueca Autoral', 'Mix de peixe, camarão e lula com pimentões na brasa, acompanhado de arroz de coco cremoso e farofa de castanha.', NULL, 18000, 'thumbs/4a63a587751d6530b1e489ab.png', 'videos/c62bb7867af694aa3ce876db.mov', 0, '', '', NULL, NULL, 1, 1, 0, NULL, '2026-06-16 15:03:22'),
(43, 15, 58, 'Tábua Brasa', 'Cortes nobres de picanha e bife ancho grelhados, acompanhados de vegetais tostados, farofa de ovos e vinagrete de caju.', NULL, 19500, 'thumbs/7c809ee56a13b3ef13e33af8.png', 'videos/0a68aeb3ef9cad98914be004.mov', 0, '', '', NULL, NULL, 1, 2, 0, NULL, '2026-06-16 15:04:16'),
(44, 15, 59, 'Mil Folhas do Sertão', 'Camadas de massa folhada crocante intercaladas com doce de leite caseiro e um toque final de flor de sal.', NULL, 3200, 'thumbs/a2e82cdcd5952d428bce1463.png', 'videos/2760d8d1b6a4e8aba7ed6d24.mov', 0, '', '', NULL, NULL, 1, 0, 0, NULL, '2026-06-16 15:06:59'),
(45, 15, 59, 'Pudim de Leite da Vovó', 'Pudim de leite condensado tradicional, extremamente cremoso e sem furinhos, servido com calda clássica de caramelo.', NULL, 2400, 'thumbs/c7993b138e77a921585e0b95.png', 'videos/4b386e50aa2346f738692dc4.mov', 0, '', '🔥', NULL, NULL, 1, 1, 0, NULL, '2026-06-16 15:08:40'),
(46, 15, 59, 'Petit Gâteau', 'Bolo artesanal de chocolate meio amargo crocante por fora e com recheio quente e cremoso, servido com sorvete de baunilha do cerrado.', NULL, 3400, 'thumbs/3c169a252ecea92f68a627b1.png', 'videos/93970f68c630505dbcf90b78.mp4', 0, '', '', NULL, NULL, 1, 2, 0, NULL, '2026-06-16 15:09:20'),
(47, 18, 67, 'ARRUMADO BAIANO', 'Carne de sol, calabresa, queijo assado e batata: o verdadeiro sabor do Nordeste em um prato farto e irresistível.', 'dairy', 3850, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 1, 0, NULL, '2026-06-23 21:12:05'),
(48, 18, 67, 'ARRUMADINHO DE CHARQUE', 'Arrumadinho com charque, calabresa, fumeiro, bacon crocante e feijão-verde.\r\nUma combinação irresistível de sabores marcantes, preparada com tempero caseiro.', 'dairy', 4250, 'thumbs/7e2cc7a2eee87bb7f177b9c9.png', 'videos/4376fc5fb0ba0ef833dd744a.mp4', 1, 'Mais pedido hoje', '?', NULL, NULL, 1, 3, 0, NULL, '2026-06-25 17:52:53'),
(49, 18, 67, 'ARRAIA DESFIADA', 'Arraia desfiada e refogada com temperos especiais, valorizando o autêntico sabor do mar.\r\nUma iguaria nordestina leve, suculenta e cheia de sabor.', 'shellfish', 2350, 'thumbs/a9a1b44ba7ea899a74ccd9c9.png', 'videos/bde93daff84acab2ca7773ae.mp4', 1, 'Mais pedido hoje', '?', NULL, NULL, 1, 3, 0, NULL, '2026-06-25 17:54:53'),
(50, 18, 67, 'BATATA FRITA', 'Batatas fritas douradas e crocantes por fora, macias por dentro.\r\nO acompanhamento perfeito para qualquer refeição ou para compartilhar.', NULL, 2250, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 4, 0, NULL, '2026-06-25 17:55:39'),
(51, 18, 67, 'BOLINHA DE QUEIJO', '12 bolinhas de queijo empanadas, douradas e crocantes por fora, com recheio cremoso por dentro.\r\nO petisco perfeito para compartilhar e saborear a qualquer hora.', 'gluten,dairy', 2850, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 5, 0, NULL, '2026-06-25 17:56:37'),
(52, 18, 67, 'BOLINHA DE CARNE', '12 bolinhas de carne temperadas, empanadas e fritas até ficarem douradas e crocantes.\r\nUm petisco suculento, cheio de sabor e perfeito para compartilhar.', NULL, 2850, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 6, 0, NULL, '2026-06-25 17:59:49'),
(53, 18, 67, 'BOLINHO DE BACALHAU', '6 bolinhas de bacalhau dourados e crocantes, preparados com bacalhau selecionado e tempero especial.\r\nUm clássico irresistível, perfeito para compartilhar.', 'gluten,shellfish', 2650, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 7, 0, NULL, '2026-06-25 18:01:43'),
(54, 18, 67, 'CALABRESA ACEBOLADA COM FRITAS', 'Calabresa acebolada grelhada, acompanhada de batatas fritas douradas e crocantes.\r\nUma combinação clássica, saborosa e perfeita para compartilhar.', NULL, 3790, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 8, 0, NULL, '2026-06-25 18:03:22'),
(55, 18, 67, 'CAMARÃO CROCANTE', 'Camarões empanados, dourados e super crocantes, servidos no ponto perfeito.\r\nUm petisco irresistível, com muito sabor e textura a cada mordida. 20 unidades', NULL, 6590, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 9, 0, NULL, '2026-06-25 18:05:21'),
(56, 18, 67, 'CAMARÃO ALHO E ÓLEO', '500g de camarões salteados no alho e óleo, suculentos e cheios de sabor.\r\nUma opção clássica, preparada com ingredientes frescos e tempero especial.', 'shellfish', 5890, 'thumbs/0863d47e91ab49420d25188e.png', 'videos/44eb1a858e146ea531690c7a.mp4', 1, 'Mais pedido hoje', '?', NULL, NULL, 1, 10, 0, NULL, '2026-06-25 18:06:16'),
(57, 18, 67, 'CARANGUEJO PANTANAL', 'Caranguejo preparado à moda Pantanal, envolvido em um molho especial e cheio de sabor.\r\nUma combinação marcante que transforma um clássico em uma experiência irresistível. Unidade', 'shellfish', 1350, 'thumbs/9c87b62f1c809bfbdb274800.png', 'videos/ef412a60a4251f2971cf4358.mp4', 1, 'Mais pedido hoje', '?', NULL, NULL, 1, 11, 0, NULL, '2026-06-25 18:08:11'),
(58, 18, 67, 'KIT CARANGUEJO PANTANAL', 'Caranguejo preparado à moda Pantanal, envolvido em um molho especial e cheio de sabor.\r\nUma combinação marcante que transforma um clássico em uma experiência irresistível. 3 unidades', 'shellfish', 3950, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 12, 0, NULL, '2026-06-25 18:09:18'),
(59, 18, 67, 'CASQUINHA DE CARANGUEJO', '200g de casquinha de caranguejo cremosa, preparada com carne de caranguejo e temperos especiais.\r\nGratinada e cheia de sabor, é uma entrada irresistível.', 'shellfish', 3790, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 13, 0, NULL, '2026-06-25 18:10:45'),
(60, 18, 67, 'CARNE DE FUMEIRO COM PIRÃO DE MACAXEIRA', 'Carne de fumeiro macia e saborosa, acompanhada de um cremoso pirão de macaxeira.\r\nUm prato típico nordestino, rico em tradição e muito sabor.', NULL, 5990, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 14, 0, NULL, '2026-06-25 18:12:06'),
(61, 18, 67, 'CARNE DE SOL COM PIRÃO DE MACAXEIRA', 'Carne de sol macia e suculenta, acompanhada de um cremoso pirão de macaxeira.\r\nUm clássico da culinária nordestina, preparado com muito sabor e tradição.', 'dairy', 5890, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 15, 0, NULL, '2026-06-25 18:14:37'),
(62, 18, 67, 'CARNE DO SOL COM FRITAS', 'Carne de sol macia e suculenta, servida com batatas fritas douradas e crocantes.\r\nUma combinação clássica que reúne tradição e muito sabor.', NULL, 4890, 'thumbs/4f9b8d1a067d61cf7d14c653.png', 'videos/1557b76ff226098e7c4190ff.mp4', 1, 'Mais pedido hoje', '?', NULL, NULL, 1, 16, 0, NULL, '2026-06-25 18:18:51'),
(63, 18, 67, 'CROQUETE DE CARNE DE SOL', 'Croquetes de carne de sol com casquinha crocante e recheio macio e saboroso.\r\nUm petisco irresistível, preparado com o autêntico sabor da culinária nordestina.', NULL, 2590, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 17, 0, NULL, '2026-06-25 18:21:48'),
(64, 18, 67, 'FILE COM FRITAS', 'Filé macio e suculento, acompanhado de batatas fritas douradas e crocantes.\r\nUma combinação clássica, perfeita para qualquer ocasião.', NULL, 6750, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 18, 0, NULL, '2026-06-25 18:23:37'),
(65, 18, 67, 'FRANGO A PASSARINHA COM FRITAS', 'Frango à passarinho dourado e crocante, acompanhado de batatas fritas sequinhas.\r\nUm clássico irresistível, perfeito para compartilhar.', NULL, 4450, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 19, 0, NULL, '2026-06-25 18:24:53'),
(66, 18, 67, 'ISCA DE PEIXE', 'Iscas de peixe empanadas, douradas e crocantes, preparadas com peixe fresco.\r\nLeves, saborosas e perfeitas para compartilhar. 12 unidades', NULL, 4250, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 20, 0, NULL, '2026-06-25 18:35:23'),
(67, 18, 67, 'LINGUA AO MOLHO COM TORRADA', 'Língua bovina macia ao molho especial, acompanhada de torradas crocantes.\r\nUm clássico cheio de sabor, preparado com tempero caseiro', NULL, 2450, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 21, 0, NULL, '2026-06-25 18:36:42'),
(68, 18, 67, 'LINGUIÇA TOSCANA ASSADA', 'Linguiça toscana assada, suculenta e dourada, preparada no ponto certo.\r\nUm petisco saboroso, ideal para compartilhar. 2 unidades', NULL, 1550, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 22, 0, NULL, '2026-06-25 18:37:52'),
(69, 18, 67, 'LINGUIÇA TOSCANA DE FRANGO', 'Linguiça toscana de frango assada, suculenta e temperada na medida certa.\r\nLeve, saborosa e perfeita para compartilhar. 2 unidades', NULL, 1750, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 23, 0, NULL, '2026-06-25 18:39:14'),
(71, 18, 67, 'MACAXEIRA GOURMET DE QUEIJO', 'Macaxeira cremosa coberta com queijo derretido e gratinado.\r\nUm acompanhamento irresistível, que une tradição e muito sabor. 6 unidades', NULL, 1990, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 24, 0, NULL, '2026-06-25 18:40:53'),
(72, 18, 67, 'MACAXEIRA GOURMET DE CARNE DE SOL', 'Macaxeira cremosa coberta com carne de sol desfiada e queijo gratinado.\r\nUma combinação tipicamente nordestina, rica em sabor e tradição.', NULL, 1990, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 25, 0, NULL, '2026-06-25 18:41:48'),
(73, 18, 67, 'MOELA AO MOLHO COM TORRADA', 'Moela ao molho, macia e bem temperada, acompanhada de torradas crocantes.\r\nUm petisco tradicional, cheio de sabor e preparado com tempero caseiro.', NULL, 2250, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 26, 0, NULL, '2026-06-25 18:42:47'),
(74, 18, 67, 'PASTEL DE QUEIJO', 'Pastéis de queijo com massa leve e crocante, recheados com queijo derretido.\r\nUm clássico irresistível, perfeito para qualquer momento. 6 unidades', 'gluten,dairy', 1750, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 27, 0, NULL, '2026-06-25 18:47:05'),
(75, 18, 67, 'PASTEL DE CARNE', 'Pastéis de carne com massa crocante e recheio suculento, temperado na medida certa.\r\nUm clássico irresistível, perfeito para compartilhar. 6 unidades', 'gluten', 1750, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 28, 0, NULL, '2026-06-25 18:49:12'),
(76, 18, 67, 'PASTEL DE CARNE DE SOL', 'Pastéis de carne de sol com massa crocante e recheio suculento, cheio de sabor nordestino.\r\nUma combinação irresistível para quem aprecia os clássicos da nossa culinária. 6 unidades', NULL, 1750, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 29, 0, NULL, '2026-06-25 18:55:13'),
(77, 18, 67, 'PASTEL DE ARRAIA', 'Pastéis de arraia com massa crocante e recheio saboroso, preparados com tempero especial.\r\nUma opção típica e irresistível para quem aprecia os sabores do litoral. 6 unidades', NULL, 1750, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 30, 0, NULL, '2026-06-25 18:56:15'),
(78, 18, 67, 'PERNIL SUINO COM FRITAS', 'Pernil suíno macio e suculento, acompanhado de batatas fritas douradas e crocantes.\r\nUma combinação clássica, preparada com muito sabor.', NULL, 3790, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 31, 0, NULL, '2026-06-25 18:57:28'),
(79, 18, 67, 'PASSARINHA FRITA', 'Frango à passarinho frito, dourado e crocante, temperado na medida certa.\r\nUm petisco clássico, suculento e perfeito para compartilhar.', NULL, 1850, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 32, 0, NULL, '2026-06-25 18:58:17'),
(80, 18, 67, 'PATINHA DE CARANGUEIJO', 'Patinhas de caranguejo empanadas, douradas e crocantes, com sabor irresistível.\r\nUm petisco perfeito para compartilhar e aproveitar o melhor do litoral. 12 unidades', NULL, 3690, 'thumbs/0ff359e05db3f479dc44e3ed.png', NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 0, 33, 0, NULL, '2026-06-25 19:00:42'),
(81, 18, 67, 'PÃO DE ALHO', 'Pão de alho crocante por fora, macio por dentro e recheado com um creme de alho irresistível.\r\nPerfeito para acompanhar sua refeição ou saborear como petisco. 2 unidades', NULL, 1750, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 34, 0, NULL, '2026-06-25 19:02:45'),
(82, 18, 67, 'QUEIJO COM MELAÇO', 'Queijo grelhado servido com melaço, unindo o sabor marcante do salgado ao toque adocicado.\r\nUma combinação clássica, simples e irresistível.', 'dairy', 2350, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 35, 0, NULL, '2026-06-25 19:04:37'),
(83, 18, 67, 'TORRESMO SUINO', '200g de torresmo suíno crocante por fora e suculento por dentro, preparado no ponto perfeito.\r\nUm petisco irresistível, cheio de sabor e tradição.', NULL, 2250, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 36, 0, NULL, '2026-06-25 19:06:19'),
(84, 18, 67, 'TORRESMO SUINO MINEIRO ESPECIAL', '200g de torresmo suíno mineiro especial, pururucado, crocante por fora e macio por dentro.\r\nUm clássico irresistível, preparado com muito sabor e tradição.', NULL, 2890, 'thumbs/0abe40fc3ce3150067b0bb87.png', 'videos/ec946f1d3c9f01a234924ce4.mp4', 1, 'Mais pedido hoje', '?', NULL, NULL, 1, 37, 0, NULL, '2026-06-25 19:07:24'),
(85, 18, 67, 'TORRESMO DE PANCETA SUINO', '300g de torresmo de panceta suína, pururucado, crocante por fora e suculento por dentro.\r\nUm petisco irresistível, com sabor marcante e textura perfeita.', NULL, 3150, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 38, 0, NULL, '2026-06-25 19:08:21'),
(86, 18, 67, 'TORRESMO DE PANCETA RETA', '550g de torresmo de panceta reta, pururucado, crocante por fora e macio por dentro.\r\nIdeal para compartilhar e aproveitar um petisco cheio de sabor.', NULL, 5290, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 39, 0, NULL, '2026-06-25 20:50:13'),
(87, 18, 67, 'TRIPA FRITA COM VINAGRETE E FAROFA', 'Tripa frita dourada e crocante, servida com vinagrete fresco e farofa temperada.\r\nUm petisco tradicional, cheio de sabor e perfeito para compartilhar.', NULL, 1930, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 41, 0, NULL, '2026-06-25 20:51:13'),
(88, 18, 67, 'SARAPATEL COM ARROZ', 'Sarapatel preparado com tempero tradicional, acompanhado de arroz soltinho.\r\nUm clássico da culinária nordestina, rico em sabor e tradição.', NULL, 2150, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 42, 0, NULL, '2026-06-25 20:52:44'),
(89, 18, 67, 'OSTRA FRESCA (50 Uni às quinta)', '50 ostras frescas, selecionadas e servidas com todo o frescor do mar.\r\nDisponível exclusivamente às quintas-feiras, enquanto durarem os estoques.', NULL, 6250, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 43, 0, NULL, '2026-06-25 20:54:36'),
(90, 18, 67, 'OSTRA FRESCA (30 Uni às quinta)', '30 ostras frescas, selecionadas e servidas com todo o frescor do mar.\r\nDisponível exclusivamente às quintas-feiras, enquanto durarem os estoques.', NULL, 3950, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 44, 0, NULL, '2026-06-25 20:55:28'),
(91, 18, 67, 'OSTRA GRATINADA (20 Uni às quinta)', '20 ostras gratinadas com queijo, douradas no ponto certo e cheias de sabor.\r\nDisponível exclusivamente às quintas-feiras, enquanto durarem os estoques.', NULL, 5290, 'thumbs/1a38c016a4f0e67ea6446081.jpeg', NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 45, 0, NULL, '2026-06-25 20:56:22'),
(93, 18, 68, 'ARROZ DE CAMARÂO', 'um prato preparado com arroz e camarões selados no azeite. junto com um molho feito pela casa com dendê, verduras e especiarias.', 'dairy,shellfish', 6990, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 3, 0, NULL, '2026-06-26 14:32:14'),
(96, 18, 68, 'CARNEIRO COZIDO COM ARROZ', 'Prato tradicional e cheio de sabor nordestino, muito bem temperado e suculento', 'gluten', 5990, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 3, 0, NULL, '2026-06-26 14:50:35'),
(98, 18, 68, 'CARNE DE SOL COM FRITAS E ARROZ', 'CARNE DE SOL PUXADA NA MANTEIGA DA TERRA COM CEBOLA ROXA E BATATAS FRITAS BEM SEQUINHAS COM UM ARROZ BRANQUINHO NO ALHO E CEBOLA', 'gluten,dairy,eggs', 5690, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 3, 0, NULL, '2026-06-26 14:54:52'),
(99, 18, 68, 'FEIJOADA CARIOCA PARA 2 PESSOAS', 'NOSSA FEIJOADA É CONHECIDA PELO PADRÃO DAS CARNES SELECIONADAS E MUITO BEM SERVIDA E PREPARADA', 'gluten,dairy,eggs', 8290, 'thumbs/f3c07ae359135f4d00639853.jpeg', NULL, 1, 'Mais pedido hoje', '?', NULL, NULL, 1, 3, 0, NULL, '2026-06-26 14:58:02'),
(100, 18, 68, 'FEIJOADA CARIOCA PARA 3 PESSOAS', 'FEIJOADA SELECIOANADA E MUITO BEM SERVIDA.', 'gluten,dairy', 9290, 'thumbs/fdd8079bfa21d5199349e592.png', 'videos/3ef9665f4645a6986c663382.mp4', 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 3, 0, NULL, '2026-06-26 15:02:09'),
(101, 18, 68, 'FRANGO A PASSARINHA COM ARROZ', 'FRANGUINHO TEMPERADO E BEM FRITINHO COM BATATAS SEQUINHAS', 'gluten,dairy,eggs', 5290, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 3, 0, NULL, '2026-06-26 15:04:37'),
(102, 18, 68, 'MISTÃO ACEBOLADA, BATATA E ARROZ', 'UM BELO PRATO PARA A FAMILIA DESGUSTAR COM CARNE, PORCO, FRANGO E CALABRESA ASSADOS.', 'gluten,dairy,eggs', 8490, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 3, 0, NULL, '2026-06-26 15:10:16'),
(103, 18, 68, 'PICANHA SUINA COM ARROZ E FRITAS', 'UMA BELA PICANHA SUINA TRINCHADA PUXADA NA MANTEIGA DA TERRA COM CEBOLA ROXA', 'gluten,dairy,eggs', 5290, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 3, 0, NULL, '2026-06-26 15:13:59'),
(104, 18, 68, 'PANELADA PARA 2 PESSOAS', 'PRATO TRADICIONAL DA CULINÁRIA NORDESTINA PREPARADO COM ESPECIARIAS DA CASA', 'gluten,dairy', 5290, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 3, 0, NULL, '2026-06-26 15:16:25'),
(106, 18, 68, 'RABADA COM ARROZ E PIRÃO', 'RABO BOVINO COZIDO LENTAMENTE ATE ATINGIR A TEXTURA MACIA, MUITO BEM TEMPERADO COM VERDURAS A GOSTO', 'gluten,dairy,eggs', 6790, 'thumbs/cf8e1515f08b3a2bf8be420a.png', 'videos/7a97d50fb444c55aa42e6fd7.mp4', 1, 'Mais pedido hoje', '?', NULL, NULL, 1, 3, 0, NULL, '2026-06-26 15:22:21'),
(107, 18, 68, 'ACARAJÉ BAIANO 10 BOLINHOS', 'BOLINHO FEITO COM FEIJÃO FRADINHO TEMPERADO COM CEBOLA, ACOMPANHA VATAPÁ DE CAMARÃO, CARURU, CAMARÃO SECO E SALADA DE TOMATE', 'gluten,dairy,soy,shellfish', 4850, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 3, 0, NULL, '2026-06-26 15:58:40'),
(108, 18, 68, 'ACARAJÉ BAIANO 5 BOLINHOS', 'BOLINHOS FEITO COM FEIJÃO FRADINHO, ACOKMPANHA VATAPA DE CAMARÃO, CARURU, CAMARÃO SECO E SALADA DE TOMATE', 'gluten,dairy,eggs,shellfish', 3150, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 3, 0, NULL, '2026-06-26 16:07:38'),
(109, 18, 68, 'ARRUAMDINHO DE CHARQUE COM ARROZ', 'UM PRATO DELICIOSO COM FEIJÃO VERDE, CALABRESA, CHARQUE, BACON, FUMEIRO, FRITOS NA MANTEIGA DA TERRA VINAGRETE E FAROFA', 'gluten,dairy,eggs,soy', 4950, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 3, 0, NULL, '2026-06-26 16:10:08'),
(110, 18, 68, 'COMIDA BAIANA', 'COMIDA TIPICA BAIANA, ACOMPANHA VATAPÁ, CARURU, XINXIN DE GALINHA,FEIJÃO FRADINHO E ACOMPANHA', 'gluten,dairy,eggs,soy', 8500, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 3, 0, NULL, '2026-06-26 16:11:57'),
(111, 18, 68, 'VATAPÁ BAIANO COM ARROZ E FAROFA', 'VATAPÁ A BASE DE PÃO, LEITE, CAMARÃO SECO, AMENDOIN, CASTANHA E GENGIBRE', 'gluten,dairy,eggs,nuts,shellfish', 5850, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 3, 0, NULL, '2026-06-26 16:14:50'),
(112, 18, 68, 'BOBÓ DE CAMARÃO E ARROZ', 'A BASE É MACAXEIRA, MANTEIGA E LEITE, SUPER CREMOSO E VEM CAMARÃO PUXADO NO AZEITE É SUPER DELICIOSO.', 'gluten,dairy,eggs,shellfish', 7250, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 3, 0, NULL, '2026-06-26 16:18:58'),
(113, 18, 68, 'FILÉ DE PEIXE COM ARROZ Á GREGA', 'FILÉ DE PESCADA AMARELA GRELHADA NO AZEITE COM ARROZ D ESPECIARIAS', 'gluten,dairy,fish', 7290, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 3, 0, NULL, '2026-06-26 16:21:19'),
(114, 18, 68, 'FILÉ DE PEIXE COM CAMARÃO GRELHADO E ARROZ DE ALHO', 'FILÉ DE PESCADA AMARELA E CAMARÃO PUXADA NO AZEITE COM ARROZ DE ALHO', 'gluten,dairy,eggs,shellfish,fish', 16990, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 3, 0, NULL, '2026-06-26 16:33:50'),
(115, 18, 68, 'MOQUECA BAIANA COM CAMARÃO , PEIXE, ARROZ E PIRÃO', 'TRADICIONAL DA CULINARIA BAIANA, A MOQUECA É FEITA COM PESCADA AMARELA, AZEITE DE DENDÊ, CREME DE LEITE, LEITE E COCO E VERDURAS', 'gluten,dairy,eggs,shellfish,fish', 21700, 'thumbs/07f20401d3e90ba03c354c52.png', 'videos/eccd640b2dc2ff51cd968cb9.mp4', 1, 'Mais pedido hoje', '?', NULL, NULL, 1, 3, 0, NULL, '2026-06-26 17:02:06'),
(116, 18, 68, 'MOQUECA DE CAMARÃO COM ARROZ E PIRÃO', 'MOQUECA DE CAMARÃO DELICIOSA COM AZEITE DE DENDÊ', 'gluten,dairy,eggs,shellfish', 11950, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 3, 0, NULL, '2026-06-26 17:07:04'),
(117, 18, 68, 'MOQUECA DE PEIXE ARROZ E PIRÃO', 'MOQUECA FEITA DE PESCADA AMARELA COM AZIETE DE DENDÊ, LEITE DE COCO,CREME DE LEITE E VERDURAS', 'gluten,dairy,eggs,fish', 11950, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 3, 0, NULL, '2026-06-26 17:09:54'),
(118, 18, 68, 'MARISCADA BAIANA', 'UM PRATO PARA A FAMILIA APROVEITAR, COM OS MARISCO, PEIXE E CAMARÃO', 'gluten,dairy,eggs,shellfish,fish', 24590, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 3, 0, NULL, '2026-06-26 17:12:01'),
(119, 18, 69, 'MEIO ARROZ DE CAMARÃO', 'DECILIOSO ARROZ DE CAMARÃO PUXADO NO AZEITE DE OLIVA E UM TOQUE DE DENDÊ', 'gluten,dairy,eggs,shellfish', 3950, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 2, 0, NULL, '2026-06-26 17:20:56'),
(120, 18, 69, 'MEIO ARRUMADINHO DE CHARQUE', 'DELICIOSO ARRUMADINHO PARA VOCÊ SE DELICIAR', 'gluten,dairy,eggs', 2250, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 2, 0, NULL, '2026-06-26 17:22:57'),
(121, 18, 69, 'MEIA FEIJOADA CARIOCA', 'FEIJOADA TRADICIONAL E SELECIONADA', 'gluten,dairy', 3890, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 2, 0, NULL, '2026-06-26 17:27:45'),
(122, 18, 69, 'MEIA MOQUECA BAIANA ( PEIXE E CAMARÃO)', 'MOQUECA DELICIOSA', 'gluten,dairy,shellfish,fish', 6450, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 2, 0, NULL, '2026-06-26 17:33:59'),
(123, 18, 69, 'MEIA MOQUECA DE CAMARÃO', 'MOQUECA DELICIOSA', 'gluten,dairy,shellfish', 6250, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 2, 0, NULL, '2026-06-26 17:37:18'),
(124, 18, 69, 'MEIA MOQUECA DE PEIXE', 'MOQUECA DELICIOSA', 'gluten,dairy,fish', 6250, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 2, 0, NULL, '2026-06-26 17:38:10'),
(126, 18, 69, 'MEIA PANELADA', '', 'gluten', 3990, 'thumbs/4636cd8e043931033e987d94.jpeg', NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 2, 0, NULL, '2026-06-26 17:41:41'),
(127, 18, 70, 'ASA DE FRANGO ( 4 UNIDADES)', 'ASINHA DE FRANGO BEM SEQUINHA ACOMPANHA FAROFA E VINAGRETE', 'gluten,dairy,eggs', 1350, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 4, 0, NULL, '2026-06-26 17:44:22'),
(128, 18, 70, 'CARNE ACEBOLADA', 'CARNE NA CHAPA COM MANTEIGA DA TERRA, ACOMPANHA FAROFA E VINAGRETE', 'gluten,dairy', 1490, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 4, 0, NULL, '2026-06-26 17:45:50'),
(129, 18, 70, 'CARNE COM BACON 120G', 'CARNE COM BACON NA CHAPA COM MATEIGA DA TERRA', 'gluten,dairy', 1690, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 4, 0, NULL, '2026-06-26 17:47:02'),
(130, 18, 70, 'CORAÇÃO DE FRANGO 200G', 'CORAÇÃO NA CHAPA COM MANTEIGA DA TERRA E CEBOLA ROXA', 'gluten,dairy,eggs', 2750, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 4, 0, NULL, '2026-06-26 17:48:51'),
(131, 18, 70, 'FRANGO/ FILÉ 120G', 'FRANGO NA CHAPA COM MANTEIGA DA TERRA', 'gluten,dairy,eggs', 1290, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 4, 0, NULL, '2026-06-26 17:50:00'),
(132, 18, 70, 'PORCO 120G', 'PORCO NA CHAPA COM MANTEIGA DA TERRA', 'gluten,dairy', 1290, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 4, 0, NULL, '2026-06-26 17:52:36'),
(133, 18, 70, 'MAMINHA 120G', 'MAMINHA NA CAHAPA COM MANTEIGA DA TERRA E CEBOLA ROXA', 'gluten,dairy', 1850, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 4, 0, NULL, '2026-06-26 17:53:24'),
(134, 18, 70, 'PICANHA ARGENTINA 120G', 'PICANHA NA CHAPA COM MANTEIGA DA TERRA COM CEBOLA ROXA', 'gluten,dairy', 2690, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 4, 0, NULL, '2026-06-26 17:54:23'),
(135, 18, 71, 'CALDO DE MOCOTÓ', '', 'gluten,eggs', 1350, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 5, 0, NULL, '2026-06-26 18:03:19'),
(136, 18, 71, 'CALDO DE PEIXE', '', 'gluten,dairy,eggs,fish', 1250, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 5, 0, NULL, '2026-06-26 18:04:19'),
(137, 18, 71, 'CALDO DE FEIJÃO', '', 'gluten,eggs', 810, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 4, 0, NULL, '2026-06-26 18:07:30'),
(138, 18, 71, 'CALDO DE SURURU', '', 'gluten,dairy,eggs,shellfish,fish', 1310, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 5, 0, NULL, '2026-06-26 18:08:29'),
(139, 18, 71, 'CALDO DE CARANGUEJO ( AS QUINTAS)', '', 'gluten,dairy,eggs,shellfish', 710, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 4, 0, NULL, '2026-06-26 18:10:09'),
(140, 18, 71, 'CALDO DE CARANGUEJO ( AS QUINTAS)', '', 'gluten,dairy,eggs,shellfish', 710, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 5, 0, NULL, '2026-06-26 18:10:32'),
(142, 18, 72, 'MEIO ARROZ BRANCO', '', 'gluten,eggs', 850, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 6, 0, NULL, '2026-06-26 18:43:45'),
(143, 18, 72, 'MEIA BATATA FRITA', '', 'gluten', 1450, 'thumbs/a2bc4e5609619a666a3ec575.png', 'videos/96c0003dbbb21f63942d7486.mp4', 1, 'Mais pedido hoje', '?', NULL, NULL, 1, 6, 0, NULL, '2026-06-26 18:44:23'),
(144, 18, 72, 'MEIO BAIÃO DE DOIS', '', 'gluten,dairy,eggs', 1650, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 6, 0, NULL, '2026-06-26 18:45:35'),
(145, 18, 72, 'MEIO FEIJÃO VERDDE', '', 'gluten,dairy,eggs', 1850, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 6, 0, NULL, '2026-06-26 18:46:12'),
(146, 18, 72, 'PANELADA TIRA GOSTO COM ARROZ', '', 'gluten', 1990, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 6, 0, NULL, '2026-06-26 18:46:41'),
(147, 18, 72, 'FEIJOADA TIRA GOSTO COM ARROZ', '', 'gluten,dairy,eggs', 1990, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 6, 0, NULL, '2026-06-26 18:47:48'),
(148, 18, 73, 'ARROZ BRANCO', '', 'gluten,eggs', 1350, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 7, 0, NULL, '2026-06-26 18:54:29'),
(149, 18, 73, 'ARROZ DE ALHO', '', 'gluten,eggs', 2390, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 7, 0, NULL, '2026-06-26 18:55:12'),
(150, 18, 73, 'ARROZ A GREGA', '', 'gluten,eggs', 2550, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 7, 0, NULL, '2026-06-26 18:55:41'),
(151, 18, 73, 'ARROZ DE BRÓCOLIS', '', 'gluten,eggs', 2750, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 7, 0, NULL, '2026-06-26 18:57:46'),
(152, 18, 73, 'BAIÃO DE DOIS', '', 'gluten,dairy,eggs', 2650, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 7, 0, NULL, '2026-06-26 18:58:25'),
(153, 18, 73, 'FEIJÃO VERDE', '', 'gluten,dairy,eggs', 3150, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 7, 0, NULL, '2026-06-26 18:58:57'),
(154, 18, 73, 'FAROFA DE OVOS', '', 'gluten,dairy,eggs', 1290, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 7, 0, NULL, '2026-06-26 18:59:34'),
(155, 18, 73, 'OVOS FRITOS', '', 'gluten,dairy,eggs', 500, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 7, 0, NULL, '2026-06-26 19:00:19'),
(156, 18, 74, 'PETIT GATEAU', 'UM DELICIOSO BOLINHO DE CHOCOLATE COM SORVETE', 'gluten,dairy,eggs', 2890, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 8, 0, NULL, '2026-06-26 19:01:20'),
(157, 18, 74, 'PUDIN NO COPO AMERICANO', '', 'gluten,dairy,eggs', 1700, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 8, 0, NULL, '2026-06-26 19:01:57'),
(158, 18, 74, 'BROWNIE DE CHOCOLATE', '', 'gluten,dairy,eggs', 850, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 8, 0, NULL, '2026-06-26 19:02:31'),
(159, 18, 75, 'PICANHA ARGENTINA 300G', 'PICANHA ARGENTINA ASSADA NA CHURRASQUEIRA', 'gluten,dairy,eggs', 7290, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 9, 0, NULL, '2026-06-26 19:05:33'),
(160, 18, 75, 'MAMINHA IMPORTADA 300G', 'MAMINHA ASSADA NA CHURRASQUEIRA', 'gluten,dairy,eggs', 4890, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 9, 0, NULL, '2026-06-26 19:07:11'),
(161, 18, 75, 'LINGUIÇA CUIABANA 250G', 'LINGUIÇA CUIABANA ARTESNAL ASSADA NA CHURRASQUEIRA', 'gluten,dairy,eggs,soy', 4390, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 9, 0, NULL, '2026-06-26 19:08:35'),
(162, 18, 75, 'LINGUIÇA CUIABANA APIMEMTADA 250G', '', 'gluten,dairy,eggs,soy', 4390, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 9, 0, NULL, '2026-06-26 19:09:55'),
(163, 18, 75, 'COSTELA SUINA 600G', '', 'gluten,dairy,eggs', 5190, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 9, 0, NULL, '2026-06-26 19:10:27'),
(164, 18, 76, 'SPATEN 600ML', '', 'gluten', 1790, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 10, 0, NULL, '2026-06-26 19:27:54'),
(165, 18, 76, 'BRAHMA DUPLO MALTE 600ML', '', 'gluten', 1450, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 10, 0, NULL, '2026-06-26 19:29:11'),
(166, 18, 76, 'BOHEMIA 600ML', '', 'gluten', 1350, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 10, 0, NULL, '2026-06-26 19:29:53'),
(167, 18, 76, 'STELLA ARTOIS 600ML', '', 'gluten', 1850, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 10, 0, NULL, '2026-06-26 19:30:47'),
(168, 18, 76, 'ORIGINAL 600ML', '', 'gluten', 1810, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 10, 0, NULL, '2026-06-26 19:31:20'),
(169, 18, 76, 'SKOL 600ML', '', 'gluten', 1250, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 10, 0, NULL, '2026-06-26 19:31:53'),
(170, 18, 76, 'AMSTEL 600ML', '', 'gluten', 1350, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 10, 0, NULL, '2026-06-26 19:32:14'),
(171, 18, 76, 'HEINEKEN 600ML', '', 'gluten', 1999, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 10, 0, NULL, '2026-06-26 19:32:42'),
(172, 18, 77, 'ÁGUA SEM GÁS', '', NULL, 492, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 11, 0, NULL, '2026-06-26 19:35:06'),
(173, 18, 77, 'ÁGUA COM GÁS', '', NULL, 650, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 11, 0, NULL, '2026-06-26 19:36:18'),
(174, 18, 77, 'ÁGUA TONICA', '', NULL, 980, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 11, 0, NULL, '2026-06-26 19:36:57'),
(175, 18, 77, 'AGUA DE COCO COPO', '', NULL, 790, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 11, 0, NULL, '2026-06-26 19:37:42'),
(176, 18, 77, 'AGUA DE COCO JARRA', '', NULL, 1570, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 11, 0, NULL, '2026-06-26 19:38:12'),
(177, 18, 77, 'AQUARIUS FRESH', '', NULL, 850, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 11, 0, NULL, '2026-06-26 19:39:56'),
(178, 18, 77, 'SKOL BEATS LONG NECK', '', 'gluten', 1390, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 11, 0, NULL, '2026-06-26 19:40:32'),
(179, 18, 77, 'RED BULL', '', NULL, 1750, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 11, 0, NULL, '2026-06-26 19:40:54'),
(180, 18, 77, 'REFRIGERANTE LATA', '', NULL, 850, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 11, 0, NULL, '2026-06-26 19:41:18'),
(181, 18, 77, 'COCA COLA 1 LITRO', '', NULL, 1480, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 11, 0, NULL, '2026-06-26 19:41:52'),
(182, 18, 77, 'SÃO GERALDO LATA', '', NULL, 850, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 11, 0, NULL, '2026-06-26 19:42:15'),
(183, 18, 77, 'SÃO GERALDO LATA', '', NULL, 850, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 11, 0, NULL, '2026-06-26 19:42:28'),
(184, 18, 77, 'SÃO GERALDO 1 LITRO', '', NULL, 1390, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 11, 0, NULL, '2026-06-26 19:42:58'),
(185, 18, 77, 'SMINORFF ICE', '', NULL, 1650, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 11, 0, NULL, '2026-06-26 19:44:04'),
(186, 18, 78, 'CAIPIRINHA DE LIMÃO', '', NULL, 1450, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 12, 0, NULL, '2026-06-26 19:45:45'),
(187, 18, 78, 'CAIPIRINHA DE FRUTA', '', NULL, 1850, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 12, 0, NULL, '2026-06-26 19:46:17'),
(188, 18, 78, 'CAIPIROSKA DE LIMÃO', '', NULL, 1950, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 12, 0, NULL, '2026-06-26 19:47:03'),
(189, 18, 78, 'CAIPIROSKA DE FRUTA', '', NULL, 2150, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 12, 0, NULL, '2026-06-26 19:48:12'),
(190, 18, 78, 'CAIPIROSKA DE FRUTA', '', NULL, 2150, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 12, 0, NULL, '2026-06-26 20:14:52'),
(191, 18, 78, 'CAIPIROSKA DE ABSOLUT', '', NULL, 2550, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 12, 0, NULL, '2026-06-26 20:15:52'),
(192, 18, 78, 'CAIPIROSKA DE ABSOLUT', '', NULL, 2550, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 12, 0, NULL, '2026-06-26 20:15:56'),
(193, 18, 78, 'COQUETEL COM FURTASCOM VODKA', '', NULL, 2450, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 12, 0, NULL, '2026-06-26 20:16:25'),
(194, 18, 78, 'KAPETA', '', NULL, 2250, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 12, 0, NULL, '2026-06-26 20:16:46'),
(195, 18, 78, 'COQUETEL DE FRUTAS SEM ALCOOL', '', NULL, 2150, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 12, 0, NULL, '2026-06-26 20:17:17'),
(196, 18, 79, 'BLACK WHITE 50 ML', '', NULL, 810, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 13, 0, NULL, '2026-06-26 20:17:54'),
(197, 18, 79, 'RED LABEL 50ML', '', NULL, 1120, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 13, 0, NULL, '2026-06-26 20:18:21'),
(198, 18, 79, 'OLD PAR 12 ANOS 50ML', '', NULL, 1850, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 13, 0, NULL, '2026-06-26 20:18:54'),
(199, 18, 79, 'CHIVAS 50ML', '', NULL, 1890, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 13, 0, NULL, '2026-06-26 20:19:13'),
(200, 18, 79, 'JACK DANIELS 50ML', '', NULL, 1650, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 13, 0, NULL, '2026-06-26 20:19:37'),
(201, 18, 80, 'COINTREAU', '', NULL, 1550, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 14, 0, NULL, '2026-06-26 20:41:38'),
(202, 18, 80, 'LICOR 43', '', NULL, 2290, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 14, 0, NULL, '2026-06-26 20:42:08'),
(203, 18, 80, 'LICOR 43', '', NULL, 2290, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 14, 0, NULL, '2026-06-26 20:42:15'),
(204, 18, 80, 'FRANGELICO', '', NULL, 1890, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 14, 0, NULL, '2026-06-26 20:42:47'),
(205, 18, 80, 'LICOR BAIANO CRAVINHO', '', NULL, 600, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 14, 0, NULL, '2026-06-26 20:43:23'),
(206, 18, 80, 'LICOR DA BAHIA SABORES', '', NULL, 600, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 14, 0, NULL, '2026-06-26 20:44:33'),
(207, 18, 81, 'CAMPARI 50ML', '', NULL, 890, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 15, 0, NULL, '2026-06-26 20:45:21'),
(208, 18, 81, 'GIN ROCK 50ML', '', NULL, 850, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 15, 0, NULL, '2026-06-26 20:45:59'),
(209, 18, 81, 'GIN TANQUERAY', '', NULL, 1650, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 15, 0, NULL, '2026-06-26 20:50:12'),
(210, 18, 81, 'RUM MONTILLA', '', NULL, 850, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 15, 0, NULL, '2026-06-26 20:50:51'),
(211, 18, 81, 'RUM MONTILLA', '', NULL, 850, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 15, 0, NULL, '2026-06-26 20:51:06'),
(212, 18, 81, 'RUM BACARDI', '', NULL, 850, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 15, 0, NULL, '2026-06-26 20:51:31'),
(213, 18, 81, 'TEQUILA CUERVO PRATA', '', NULL, 1650, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 15, 0, NULL, '2026-06-26 20:52:07'),
(214, 18, 81, 'TEQUILA TEQPAR', '', NULL, 910, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 15, 0, NULL, '2026-06-26 20:53:27'),
(215, 18, 81, 'TEQUILA NACIONAL', '', NULL, 850, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 15, 0, NULL, '2026-06-26 20:54:02'),
(216, 18, 81, 'VINHO DIVERSOS', '', NULL, 10500, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 15, 0, NULL, '2026-06-26 20:54:32'),
(217, 18, 81, 'SMINORFF 50ML', '', NULL, 910, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 15, 0, NULL, '2026-06-26 20:55:16'),
(218, 18, 81, 'ABSOLUT 50ML', '', NULL, 1500, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 15, 0, NULL, '2026-06-26 20:55:39'),
(219, 18, 81, 'CACHAÇA GERMANA 50ML', '', NULL, 1790, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 15, 0, NULL, '2026-06-26 20:56:16'),
(220, 18, 81, 'CACHAÇA COLONIAL TRADICIONAL 50ML', '', NULL, 1290, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 15, 0, NULL, '2026-06-26 20:56:56'),
(221, 18, 81, 'YPIOCA BRANCA 50ML', '', NULL, 650, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 15, 0, NULL, '2026-06-26 20:57:32'),
(222, 18, 81, 'YPIOCA AMARELA', '', NULL, 750, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 15, 0, NULL, '2026-06-26 20:58:07'),
(223, 18, 81, 'YPIOCA 150 50ML', '', NULL, 1050, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 15, 0, NULL, '2026-06-26 20:58:33'),
(224, 18, 81, 'YPIOCA 160 50ML', '', NULL, 1210, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 15, 0, NULL, '2026-06-26 20:58:57'),
(225, 18, 82, 'ACEROLA COPO', '', NULL, 850, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 16, 0, NULL, '2026-06-26 21:01:07'),
(226, 18, 82, 'ACEROLA JARRA', '', NULL, 1650, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 16, 0, NULL, '2026-06-26 21:01:42'),
(227, 18, 82, 'CAJA COPO', '', NULL, 850, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 16, 0, NULL, '2026-06-26 21:02:28'),
(228, 18, 82, 'CAJA JARRA', '', NULL, 1650, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 16, 0, NULL, '2026-06-26 21:02:58'),
(229, 18, 82, 'CAJA JARRA', '', NULL, 1650, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 16, 0, NULL, '2026-06-26 21:03:11'),
(230, 18, 82, 'GOIABADA COPO', '', NULL, 850, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 16, 0, NULL, '2026-06-26 21:04:50'),
(231, 18, 82, 'GOIABA  JARRA', '', NULL, 1650, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 16, 0, NULL, '2026-06-26 21:05:28'),
(232, 18, 82, 'LARANJA COPO', '', NULL, 850, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 16, 0, NULL, '2026-06-26 21:06:01'),
(233, 18, 82, 'LARANJA JARRA', '', NULL, 1650, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 16, 0, NULL, '2026-06-26 21:06:38'),
(234, 18, 82, 'LIMÃO COPO', '', NULL, 850, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 16, 0, NULL, '2026-06-26 21:07:14'),
(235, 18, 82, 'LIMÃO JARRA', '', NULL, 1650, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 16, 0, NULL, '2026-06-26 21:07:47'),
(236, 18, 82, 'LIMONADA SUIÇA COPO', '', NULL, 1000, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 16, 0, NULL, '2026-06-26 21:08:19'),
(237, 18, 82, 'SUMO DE LIMÃO', '', NULL, 200, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 16, 0, NULL, '2026-06-26 21:08:40'),
(238, 18, 82, 'MARACUJÁ COPO', '', NULL, 850, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 16, 0, NULL, '2026-06-26 21:09:04'),
(239, 18, 82, 'MARACUJA JARRA', '', NULL, 1650, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 16, 0, NULL, '2026-06-26 21:09:25'),
(240, 18, 83, 'NEGRONI', 'GIN, CAMPARI, VERMOUTH, LARAJNA', NULL, 2790, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 17, 0, NULL, '2026-06-26 21:12:14');
INSERT INTO `products` (`id`, `restaurant_id`, `category_id`, `title`, `description`, `allergens`, `price_cents`, `thumb_image`, `video_file`, `is_featured`, `featured_label`, `featured_icon`, `prep_minutes`, `popularity`, `is_active`, `sort_order`, `ar_enabled`, `ar_model_file`, `created_at`) VALUES
(241, 18, 83, 'BRAMBLE', 'GIN, SUCO DE MORANGO AGUA TONICA E GELO', NULL, 2790, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 17, 0, NULL, '2026-06-26 21:12:59'),
(242, 18, 83, 'PINA COLADA', 'SUCO DE ABACAXI, MALIBU, RUM, LEITE DE COCO, LEITE CONDENSADO E GELO', NULL, 2690, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 17, 0, NULL, '2026-06-26 21:15:04'),
(243, 18, 83, 'MARGUERITA', 'TEQUILA, CONHAQUE, SUCO DE LIMÃO E GELO', NULL, 2990, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 17, 0, NULL, '2026-06-26 21:15:53'),
(244, 18, 83, 'CAIPICERVA', 'CACHAÇA, SUMO DE LIMÃO, CERVEJA LONG', NULL, 3290, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 17, 0, NULL, '2026-06-26 21:16:56'),
(245, 18, 83, 'MOJITO', 'RON MONTILLA, AGUA COM GAS, SUCO DE LIMÃO, HORTELÃ E GELO', NULL, 2490, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 17, 0, NULL, '2026-06-26 21:17:53'),
(246, 18, 83, 'SEX ON THE BEACH', 'VODKA, SUCO DE LARANJA, LICOR GROSELHA E GELO', NULL, 2790, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 17, 0, NULL, '2026-06-26 21:19:59'),
(247, 18, 83, 'GIN FRUTAS VERMELHAS', 'GIN, MONTILLA, AMORA, XAROPE DE MORANGO E GELO', NULL, 1990, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 17, 0, NULL, '2026-06-26 21:21:10'),
(248, 18, 83, 'APEROL', 'APEROL, ESPUMANTE, AGUA COM GAS E GELO', NULL, 2990, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 17, 0, NULL, '2026-06-26 21:22:21'),
(249, 18, 83, 'LAGOA AZUL', 'VODKA, SUCO DE LIMÃO, SPRIT, CURUÇU BLUEE GELO', NULL, 2590, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 17, 0, NULL, '2026-06-26 21:26:54'),
(250, 18, 83, 'LAGOA AZUL', 'VODKA, SUCO DE LIMÃO, SPRIT, CURUÇU BLUEE GELO', NULL, 2590, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 17, 0, NULL, '2026-06-26 21:27:23'),
(251, 18, 84, 'COMBO 01', 'PICANHA 300G, BAIÃO, BATATA E COCA 1 LITRO', 'gluten,dairy,eggs,soy', 11050, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 18, 0, NULL, '2026-06-26 21:30:09'),
(252, 18, 84, 'COMBO 02', 'MAMINHA 300G, BAIÃO, BATATA E COCA 1 LITRO', NULL, 8990, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 18, 0, NULL, '2026-06-26 21:30:57'),
(253, 18, 84, 'COMBO 03', 'COASTELA SUINA 600G, BAIÃO, BATATA E COCA 1 LITRO', NULL, 9250, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 18, 0, NULL, '2026-06-26 21:34:04'),
(254, 18, 84, 'COMBO 05', 'XINXIN DE GALINHA, CARURU, VATAPÁ, ARROZ, FAROFA, FEIJÃO FRADINHO', NULL, 8500, NULL, NULL, 0, 'Mais pedido hoje', '?', NULL, NULL, 1, 18, 0, NULL, '2026-06-26 21:44:06');

-- --------------------------------------------------------

--
-- Estrutura para tabela `restaurants`
--

CREATE TABLE `restaurants` (
  `id` int(11) NOT NULL,
  `name` varchar(190) NOT NULL,
  `slug` varchar(190) NOT NULL,
  `email` varchar(190) NOT NULL,
  `email_verified_at` datetime DEFAULT NULL,
  `email_verification_token` varchar(120) DEFAULT NULL,
  `email_verification_sent_at` datetime DEFAULT NULL,
  `cpf_cnpj` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `seller_agent_id` int(11) DEFAULT NULL,
  `status` enum('pending','active','suspended','cancelled') NOT NULL DEFAULT 'active',
  `is_model` tinyint(1) NOT NULL DEFAULT 0,
  `asaas_customer_id` varchar(100) DEFAULT NULL,
  `asaas_subscription_id` varchar(100) DEFAULT NULL,
  `adesao_cents` int(11) DEFAULT NULL,
  `mensalidade_cents` int(11) DEFAULT NULL,
  `plan_id` int(11) DEFAULT NULL,
  `activated_at` timestamp NULL DEFAULT NULL,
  `subscription_expires_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `restaurants`
--

INSERT INTO `restaurants` (`id`, `name`, `slug`, `email`, `email_verified_at`, `email_verification_token`, `email_verification_sent_at`, `cpf_cnpj`, `password_hash`, `phone`, `is_active`, `seller_agent_id`, `status`, `is_model`, `asaas_customer_id`, `asaas_subscription_id`, `adesao_cents`, `mensalidade_cents`, `plan_id`, `activated_at`, `subscription_expires_at`, `created_at`, `latitude`, `longitude`, `address`) VALUES
(15, 'Modelo1', 'modelo1', 'modelo1@playmenu.com', NULL, NULL, NULL, NULL, '$2y$10$orcChA0syQcJrP6CGWZSReIc7e2AYaNa4HX3XY8tT25QatKjxYcnS', '5585996998871', 1, NULL, 'active', 1, NULL, NULL, NULL, NULL, NULL, '2026-06-16 15:38:20', NULL, '2026-06-16 13:06:20', NULL, NULL, NULL),
(16, 'Nutri Café', 'nutri-caf', 'Georgiobaiano@gmail.com', NULL, NULL, NULL, NULL, '$2y$10$H8UZdqxp.q6H8lk9swxtd.yT7IrWz3CsbIlpC1zqHccPbVGn7BL6W', NULL, 1, NULL, 'active', 1, NULL, NULL, NULL, NULL, NULL, '2026-06-17 12:14:19', NULL, '2026-06-17 12:11:08', NULL, NULL, NULL),
(18, 'Buteco do Baiano', 'buteco-do-baiano', 'thatianasantiago73@gmail.com', NULL, '289b48dbb75c7fc6624385b164f846bf024834119f1c85ffcdb718f8eef8449b', '2026-07-10 19:57:32', NULL, '$2y$10$.IVI28EBNWan/zpWNzUQ7uuIEHknbd3sMIA0zpls88bYSO0JDHwHS', '85988365298', 1, NULL, 'active', 1, NULL, NULL, NULL, NULL, NULL, '2026-06-23 21:15:57', NULL, '2026-06-23 20:25:50', NULL, NULL, 'Rua Oito de Setembro, 1444, Varjota, Fortaleza - CE'),
(19, 'Teste 2', 'teste-2', 'teste2@playmenu.com', NULL, 'd6c01e82abc4fc190eee7f254cfcc1c789a9383c17bf323ec7055b3151a3d3f1', '2026-07-06 20:01:50', NULL, '$2y$10$bbuqrkQdOZ3JL2YlsISBxOo1D5FDEv4wLrNj/BtHYUJrRFKpZXck.', '85997737737', 0, NULL, 'pending', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-06 20:01:50', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `restaurant_reviews`
--

CREATE TABLE `restaurant_reviews` (
  `id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `customer_name` varchar(120) DEFAULT NULL,
  `rating` tinyint(1) NOT NULL,
  `comment` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `reviewed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `restaurant_reviews`
--

INSERT INTO `restaurant_reviews` (`id`, `restaurant_id`, `customer_name`, `rating`, `comment`, `status`, `created_at`, `reviewed_at`) VALUES
(0, 11, NULL, 5, 'Muito bom!!', 'pending', '2026-06-07 10:25:13', NULL),
(0, 7, NULL, 5, 'Muito bom!!!!', 'pending', '2026-06-09 01:32:38', NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `store_name` varchar(255) DEFAULT NULL,
  `tagline` varchar(255) DEFAULT NULL,
  `badge_text` varchar(100) DEFAULT 'Antenado',
  `logo_image` varchar(255) DEFAULT NULL,
  `cover_image` varchar(255) DEFAULT NULL,
  `instagram` varchar(100) DEFAULT NULL,
  `whatsapp` varchar(20) DEFAULT NULL,
  `social_links` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`social_links`)),
  `address` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `settings`
--

INSERT INTO `settings` (`id`, `restaurant_id`, `store_name`, `tagline`, `badge_text`, `logo_image`, `cover_image`, `instagram`, `whatsapp`, `social_links`, `address`, `latitude`, `longitude`) VALUES
(1, 7, 'TESTE12', '', 'Antenado', 'branding/79a923351ab0eb408646c2b0.jpg', 'branding/2ecf004aa254e408388337b5.png', NULL, NULL, NULL, NULL, NULL, NULL),
(2, 8, 'Varanda Tropical', NULL, 'Antenado', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 9, 'RESTAUTANTE MEIRELLES', NULL, 'Antenado', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 10, 'Meireles Rooftop', NULL, 'Antenado', 'branding/ce72f5e9808cb0b1152445ba.jpg', 'branding/55090fbcc771317f1cacd34f.png', '@cocobambu', '85999090729', NULL, NULL, NULL, NULL),
(5, 11, 'LULA restro', NULL, 'Antenado', 'branding/964cf06e774df52cf8fec3bb.jpg', 'branding/63c74f2fcdc11fb458422444.png', '@lularetro', '85900000000', NULL, NULL, NULL, NULL),
(6, 12, 'Buteco do Baiano', 'Tradição Sabor Diversão', '', 'branding/937a4a367cae65ff394ebcbd.jpeg', 'branding/dfb0ed18dfcea6c02f7ad358.jpeg', '@butecodobaianoofocial', '+55 85 98836-5298', NULL, NULL, NULL, NULL),
(7, 13, 'Parrileiro Sul', NULL, 'Antenado', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(8, 14, 'Parrileiro', '', 'Antenado', 'branding/bdec1f0eedcc6e0478532cc5.png', 'branding/38c004c9105afaf465301e61.webp', '@parrileiro', '5585992044287', NULL, NULL, NULL, NULL),
(9, 15, 'Modelo1', '', 'Antenado', 'branding/986ec904e369d3cb464300a7.png', 'branding/0a80a2a76ec5f8edfdfdcf89.png', '@flowtech.softwarehouse', '5585996998871', '[{\"type\":\"ifood\",\"name\":\"iFood\",\"url\":\"https://ifood.com/\",\"icon\":\"fa-solid fa-motorcycle\"},{\"type\":\"facebook\",\"name\":\"Facebook\",\"url\":\"https://facebook.com/\",\"icon\":\"fa-brands fa-facebook-f\"}]', NULL, NULL, NULL),
(10, 16, 'Nutri Café', '', 'Escolha ser saudável', 'branding/e0f580c89b677d84344efbc4.jpeg', 'branding/50cfb4cd865f6235ec78d7da.jpeg', '@nutricafe01', '5585991849779', NULL, NULL, NULL, NULL),
(11, 17, 'RESTAURANTE TST', NULL, 'Antenado', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(12, 18, 'Buteco do Baiano', '', 'Antenado', 'branding/2334d584b9384942d62d4df8.jpeg', 'branding/fd621dd10b05ce5907b899da.jpeg', '@butecodobaianooficial', '85988365298', '[{\"name\":\"IFOOD\",\"url\":\"https://www.ifood.com.br/delivery/fortaleza-ce/buteco-do-baiano-varjota/807f2642-92e9-443a-949f-50a7460643a4?utm_medium=share\"}]', NULL, NULL, NULL),
(13, 19, 'Teste 2', NULL, 'Antenado', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `subscriptions_payments`
--

CREATE TABLE `subscriptions_payments` (
  `id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `asaas_payment_id` varchar(100) NOT NULL,
  `asaas_subscription_id` varchar(100) DEFAULT NULL,
  `kind` enum('adesao','mensalidade') NOT NULL,
  `plan_id` int(11) DEFAULT NULL,
  `value_cents` int(11) NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'pending',
  `billing_type` varchar(30) DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `raw_json` longtext DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `subscriptions_payments`
--

INSERT INTO `subscriptions_payments` (`id`, `restaurant_id`, `asaas_payment_id`, `asaas_subscription_id`, `kind`, `plan_id`, `value_cents`, `status`, `billing_type`, `paid_at`, `raw_json`, `created_at`) VALUES
(2, 5, 'pay_d44u7xid6nsa0kr9', NULL, 'adesao', NULL, 29900, 'pending', 'CREDIT_CARD', NULL, NULL, '2026-06-02 23:25:16'),
(3, 6, 'pay_hi85bcx6bazmz3in', NULL, 'adesao', NULL, 29900, 'pending', 'PIX', NULL, NULL, '2026-06-03 02:51:23'),
(4, 7, 'pay_iv4rby42zhslg32h', NULL, 'adesao', NULL, 29900, 'pending', 'PIX', NULL, NULL, '2026-06-03 02:52:25'),
(5, 7, 'pay_xr36bldijusgtl42', NULL, 'adesao', NULL, 29900, 'pending', 'PIX', NULL, NULL, '2026-06-03 02:52:54'),
(6, 14, 'pay_tlsvgkk09ovtytc5', NULL, 'adesao', 1, 29900, 'cancelled', 'PIX', NULL, NULL, '2026-06-12 07:37:18'),
(7, 14, 'pay_6m8e1vk40hos7zdt', NULL, 'adesao', 2, 29900, 'cancelled', 'PIX', NULL, NULL, '2026-06-12 07:40:08'),
(8, 14, 'pay_geoa5hncqyqzlsjf', NULL, 'adesao', 2, 29900, 'cancelled', 'PIX', NULL, NULL, '2026-06-12 07:40:24'),
(9, 14, 'pay_l5ppjv9emshqf6yg', NULL, 'adesao', 2, 29900, 'cancelled', 'PIX', NULL, NULL, '2026-06-12 07:40:25'),
(10, 14, 'pay_d76aj72riq66g0od', NULL, 'adesao', 2, 29900, 'cancelled', 'PIX', NULL, NULL, '2026-06-12 07:40:32'),
(11, 14, 'pay_fxtollmf5rpd0nod', NULL, 'mensalidade', 1, 14700, 'cancelled', 'PIX', NULL, NULL, '2026-06-12 08:16:34'),
(12, 14, 'pay_nie19hp7liiqzc8e', NULL, 'mensalidade', 2, 72000, 'cancelled', 'CREDIT_CARD', NULL, NULL, '2026-06-12 08:16:45'),
(13, 14, 'pay_1278ovo31x42yhoe', NULL, 'mensalidade', 1, 14700, 'cancelled', 'PIX', NULL, NULL, '2026-06-12 08:26:49'),
(14, 14, 'pay_mx6c3yrfi99gz920', NULL, 'mensalidade', 2, 72000, 'cancelled', 'PIX', NULL, NULL, '2026-06-12 08:27:34'),
(15, 14, 'pay_84zm3gfwu3aduqr6', NULL, 'mensalidade', 1, 14700, 'cancelled', 'PIX', NULL, NULL, '2026-06-12 08:37:17'),
(16, 14, 'pay_63cagi68zljr0a7z', NULL, 'mensalidade', 1, 14700, 'cancelled', 'CREDIT_CARD', NULL, NULL, '2026-06-12 08:37:52'),
(17, 14, 'pay_mu4ttsc9bg7szvu9', NULL, 'mensalidade', 1, 14700, 'pending', 'PIX', NULL, NULL, '2026-06-12 09:04:06');

-- --------------------------------------------------------

--
-- Estrutura para tabela `support_materials`
--

CREATE TABLE `support_materials` (
  `id` int(11) NOT NULL,
  `title` varchar(180) NOT NULL,
  `description` text DEFAULT NULL,
  `audience` varchar(30) NOT NULL DEFAULT 'all',
  `material_type` varchar(30) NOT NULL DEFAULT 'file',
  `file_path` varchar(255) DEFAULT NULL,
  `original_filename` varchar(255) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `external_url` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `video_requests`
--

CREATE TABLE `video_requests` (
  `id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `title` varchar(190) NOT NULL,
  `notes` text DEFAULT NULL,
  `image_file` varchar(255) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `value_cents` int(11) NOT NULL DEFAULT 0,
  `auto_apply` tinyint(1) NOT NULL DEFAULT 1,
  `payment_status` varchar(20) DEFAULT 'pending',
  `asaas_payment_id` varchar(100) DEFAULT NULL,
  `video_file` varchar(255) DEFAULT NULL,
  `response_notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `responded_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `video_requests`
--

INSERT INTO `video_requests` (`id`, `restaurant_id`, `product_id`, `title`, `notes`, `image_file`, `status`, `value_cents`, `auto_apply`, `payment_status`, `asaas_payment_id`, `video_file`, `response_notes`, `created_at`, `responded_at`) VALUES
(12, 14, 11, 'Lote de 2 vídeos', NULL, 'thumbs/be255d9d80a976aaea624509.jpeg', 'done', 798, 1, 'pending', 'pay_chqhr9isczgwld51', 'videos/2419c90c2ab8c219ce857f1f.mp4', '', '2026-06-12 09:03:13', '2026-06-12 09:04:48'),
(13, 15, 35, 'Lote de 12 vídeos', NULL, 'thumbs/b4edc710c56ceb5fad9f03f2.png', 'pending', 4788, 1, 'pending', NULL, NULL, NULL, '2026-06-16 15:36:44', NULL),
(14, 15, 35, 'Lote de 12 vídeos', NULL, 'thumbs/b4edc710c56ceb5fad9f03f2.png', 'done', 4788, 1, 'waived', NULL, 'videos/f114d5f3a05a59c32a86e668.mp4', '', '2026-06-17 02:58:51', '2026-06-17 03:05:11'),
(15, 15, 38, 'Lote de 11 vídeos', NULL, 'thumbs/e38839eb54ece723f1205c7b.png', 'done', 4389, 1, 'waived', NULL, NULL, '', '2026-06-17 03:52:43', '2026-06-17 04:47:08');

-- --------------------------------------------------------

--
-- Estrutura para tabela `video_request_items`
--

CREATE TABLE `video_request_items` (
  `id` int(11) NOT NULL,
  `request_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `image_file` varchar(255) DEFAULT NULL,
  `video_file` varchar(255) DEFAULT NULL,
  `applied` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `video_request_items`
--

INSERT INTO `video_request_items` (`id`, `request_id`, `product_id`, `image_file`, `video_file`, `applied`, `created_at`) VALUES
(1, 4, 8, NULL, NULL, 0, '2026-06-12 08:32:20'),
(2, 4, 9, NULL, NULL, 0, '2026-06-12 08:32:20'),
(3, 4, 10, NULL, NULL, 0, '2026-06-12 08:32:20'),
(4, 4, 11, NULL, NULL, 0, '2026-06-12 08:32:20'),
(5, 4, 12, NULL, NULL, 0, '2026-06-12 08:32:20'),
(6, 4, 13, NULL, NULL, 0, '2026-06-12 08:32:20'),
(7, 4, 14, NULL, NULL, 0, '2026-06-12 08:32:20'),
(8, 4, 15, NULL, NULL, 0, '2026-06-12 08:32:20'),
(9, 4, 16, NULL, NULL, 0, '2026-06-12 08:32:20'),
(10, 4, 17, NULL, NULL, 0, '2026-06-12 08:32:20'),
(11, 4, 18, NULL, NULL, 0, '2026-06-12 08:32:20'),
(12, 5, 16, NULL, NULL, 0, '2026-06-12 08:33:32'),
(13, 6, 12, NULL, NULL, 0, '2026-06-12 08:35:41'),
(14, 6, 16, NULL, NULL, 0, '2026-06-12 08:35:41'),
(15, 7, 17, NULL, NULL, 0, '2026-06-12 08:50:06'),
(16, 7, 18, NULL, NULL, 0, '2026-06-12 08:50:06'),
(17, 8, 17, NULL, NULL, 0, '2026-06-12 08:50:11'),
(18, 8, 18, NULL, NULL, 0, '2026-06-12 08:50:11'),
(19, 9, 8, NULL, NULL, 0, '2026-06-12 08:56:21'),
(20, 9, 13, NULL, NULL, 0, '2026-06-12 08:56:21'),
(21, 10, 8, NULL, NULL, 0, '2026-06-12 09:02:48'),
(22, 10, 9, NULL, NULL, 0, '2026-06-12 09:02:48'),
(23, 10, 10, NULL, NULL, 0, '2026-06-12 09:02:48'),
(24, 10, 11, NULL, NULL, 0, '2026-06-12 09:02:48'),
(25, 10, 12, NULL, NULL, 0, '2026-06-12 09:02:48'),
(26, 10, 13, NULL, NULL, 0, '2026-06-12 09:02:48'),
(27, 10, 14, NULL, NULL, 0, '2026-06-12 09:02:48'),
(28, 10, 15, NULL, NULL, 0, '2026-06-12 09:02:48'),
(29, 10, 16, NULL, NULL, 0, '2026-06-12 09:02:48'),
(30, 10, 17, NULL, NULL, 0, '2026-06-12 09:02:48'),
(31, 10, 18, NULL, NULL, 0, '2026-06-12 09:02:48'),
(32, 11, 16, NULL, NULL, 0, '2026-06-12 09:03:03'),
(33, 12, 11, NULL, 'videos/2419c90c2ab8c219ce857f1f.mp4', 1, '2026-06-12 09:03:13'),
(34, 12, 17, NULL, 'videos/2419c90c2ab8c219ce857f1f.mp4', 1, '2026-06-12 09:03:13'),
(35, 13, 35, NULL, NULL, 0, '2026-06-16 15:36:44'),
(36, 13, 36, NULL, NULL, 0, '2026-06-16 15:36:44'),
(37, 13, 37, NULL, NULL, 0, '2026-06-16 15:36:44'),
(38, 13, 38, NULL, NULL, 0, '2026-06-16 15:36:44'),
(39, 13, 39, NULL, NULL, 0, '2026-06-16 15:36:44'),
(40, 13, 40, NULL, NULL, 0, '2026-06-16 15:36:44'),
(41, 13, 41, NULL, NULL, 0, '2026-06-16 15:36:44'),
(42, 13, 42, NULL, NULL, 0, '2026-06-16 15:36:44'),
(43, 13, 43, NULL, NULL, 0, '2026-06-16 15:36:44'),
(44, 13, 44, NULL, NULL, 0, '2026-06-16 15:36:44'),
(45, 13, 45, NULL, NULL, 0, '2026-06-16 15:36:44'),
(46, 13, 46, NULL, NULL, 0, '2026-06-16 15:36:44'),
(47, 14, 35, NULL, 'videos/f114d5f3a05a59c32a86e668.mp4', 1, '2026-06-17 02:58:51'),
(48, 14, 36, NULL, 'videos/f114d5f3a05a59c32a86e668.mp4', 1, '2026-06-17 02:58:51'),
(49, 14, 37, NULL, 'videos/f114d5f3a05a59c32a86e668.mp4', 1, '2026-06-17 02:58:51'),
(50, 14, 38, NULL, 'videos/f114d5f3a05a59c32a86e668.mp4', 1, '2026-06-17 02:58:51'),
(51, 14, 39, NULL, 'videos/f114d5f3a05a59c32a86e668.mp4', 1, '2026-06-17 02:58:51'),
(52, 14, 40, NULL, 'videos/f114d5f3a05a59c32a86e668.mp4', 1, '2026-06-17 02:58:51'),
(53, 14, 41, NULL, 'videos/f114d5f3a05a59c32a86e668.mp4', 1, '2026-06-17 02:58:51'),
(54, 14, 42, NULL, 'videos/f114d5f3a05a59c32a86e668.mp4', 1, '2026-06-17 02:58:51'),
(55, 14, 43, NULL, 'videos/f114d5f3a05a59c32a86e668.mp4', 1, '2026-06-17 02:58:51'),
(56, 14, 44, NULL, 'videos/f114d5f3a05a59c32a86e668.mp4', 1, '2026-06-17 02:58:51'),
(57, 14, 45, NULL, 'videos/f114d5f3a05a59c32a86e668.mp4', 1, '2026-06-17 02:58:51'),
(58, 14, 46, NULL, 'videos/f114d5f3a05a59c32a86e668.mp4', 1, '2026-06-17 02:58:51'),
(59, 15, 38, 'thumbs/e38839eb54ece723f1205c7b.png', 'videos/0568d5490333651f32bb6ac4.mov', 1, '2026-06-17 03:52:43'),
(60, 15, 41, 'thumbs/360d91ade50d436460891421.png', 'videos/f4560969e25d8438e224b1ac.mov', 1, '2026-06-17 03:52:43'),
(61, 15, 44, 'thumbs/a2e82cdcd5952d428bce1463.png', 'videos/2760d8d1b6a4e8aba7ed6d24.mov', 1, '2026-06-17 03:52:43'),
(62, 15, 36, 'thumbs/f8cc57ae52a5e2008f94cb23.jpeg', 'videos/8bf91d9a06cee113dc556c2f.mov', 1, '2026-06-17 03:52:43'),
(63, 15, 39, 'thumbs/aec0545df233111c37cc92ff.png', 'videos/a3a6af8fd6feb59f3612555f.mp4', 1, '2026-06-17 03:52:43'),
(64, 15, 42, 'thumbs/4a63a587751d6530b1e489ab.png', 'videos/c62bb7867af694aa3ce876db.mov', 1, '2026-06-17 03:52:43'),
(65, 15, 45, 'thumbs/c7993b138e77a921585e0b95.png', 'videos/4b386e50aa2346f738692dc4.mov', 1, '2026-06-17 03:52:43'),
(66, 15, 37, 'thumbs/e685cde17d4af04877d7477a.png', 'videos/3e64f795cfebcf26dfb23b61.mp4', 1, '2026-06-17 03:52:43'),
(67, 15, 40, 'thumbs/72466283a5986c296573d99b.png', 'videos/fb54e8269b86ff6275020c5b.mp4', 1, '2026-06-17 03:52:43'),
(68, 15, 43, 'thumbs/7c809ee56a13b3ef13e33af8.png', 'videos/0a68aeb3ef9cad98914be004.mov', 1, '2026-06-17 03:52:43'),
(69, 15, 46, 'thumbs/3c169a252ecea92f68a627b1.png', 'videos/93970f68c630505dbcf90b78.mp4', 1, '2026-06-17 03:52:43');

-- --------------------------------------------------------

--
-- Estrutura para tabela `withdrawals`
--

CREATE TABLE `withdrawals` (
  `id` int(11) NOT NULL,
  `agent_id` int(11) NOT NULL,
  `amount_cents` int(11) NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `pix_key` varchar(255) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `requested_at` timestamp NULL DEFAULT current_timestamp(),
  `decided_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Índices de tabela `agents`
--
ALTER TABLE `agents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `parent_id` (`parent_id`);

--
-- Índices de tabela `agent_routes`
--
ALTER TABLE `agent_routes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `agent_id` (`agent_id`),
  ADD KEY `status` (`status`);

--
-- Índices de tabela `agent_route_stops`
--
ALTER TABLE `agent_route_stops`
  ADD PRIMARY KEY (`id`),
  ADD KEY `route_id` (`route_id`),
  ADD KEY `visit_status` (`visit_status`);

--
-- Índices de tabela `app_settings`
--
ALTER TABLE `app_settings`
  ADD PRIMARY KEY (`setting_key`);

--
-- Índices de tabela `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `commissions`
--
ALTER TABLE `commissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `agent_id` (`agent_id`),
  ADD KEY `source_payment_id` (`source_payment_id`);

--
-- Índices de tabela `commission_rules`
--
ALTER TABLE `commission_rules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `min_active_clients` (`min_active_clients`);

--
-- Índices de tabela `menu_analytics_events`
--
ALTER TABLE `menu_analytics_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `restaurant_created` (`restaurant_id`,`created_at`),
  ADD KEY `event_type` (`event_type`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `link_type` (`link_type`),
  ADD KEY `visitor_id` (`visitor_id`);

--
-- Índices de tabela `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `email` (`email`),
  ADD KEY `account` (`account_type`,`account_id`),
  ADD KEY `expires_at` (`expires_at`);

--
-- Índices de tabela `plans`
--
ALTER TABLE `plans`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `platform_settings`
--
ALTER TABLE `platform_settings`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_products_category` (`category_id`);

--
-- Índices de tabela `restaurants`
--
ALTER TABLE `restaurants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Índices de tabela `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `restaurant_id` (`restaurant_id`);

--
-- Índices de tabela `subscriptions_payments`
--
ALTER TABLE `subscriptions_payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `asaas_payment_id` (`asaas_payment_id`),
  ADD KEY `restaurant_id` (`restaurant_id`);

--
-- Índices de tabela `support_materials`
--
ALTER TABLE `support_materials`
  ADD PRIMARY KEY (`id`),
  ADD KEY `audience` (`audience`),
  ADD KEY `material_type` (`material_type`),
  ADD KEY `is_active` (`is_active`);

--
-- Índices de tabela `video_requests`
--
ALTER TABLE `video_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `restaurant_id` (`restaurant_id`);

--
-- Índices de tabela `video_request_items`
--
ALTER TABLE `video_request_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_request_id` (`request_id`),
  ADD KEY `idx_product_id` (`product_id`);

--
-- Índices de tabela `withdrawals`
--
ALTER TABLE `withdrawals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `agent_id` (`agent_id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `agents`
--
ALTER TABLE `agents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de tabela `agent_routes`
--
ALTER TABLE `agent_routes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `agent_route_stops`
--
ALTER TABLE `agent_route_stops`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de tabela `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=85;

--
-- AUTO_INCREMENT de tabela `commissions`
--
ALTER TABLE `commissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `commission_rules`
--
ALTER TABLE `commission_rules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `menu_analytics_events`
--
ALTER TABLE `menu_analytics_events`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT de tabela `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `plans`
--
ALTER TABLE `plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=255;

--
-- AUTO_INCREMENT de tabela `restaurants`
--
ALTER TABLE `restaurants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT de tabela `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de tabela `subscriptions_payments`
--
ALTER TABLE `subscriptions_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de tabela `support_materials`
--
ALTER TABLE `support_materials`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `video_requests`
--
ALTER TABLE `video_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de tabela `video_request_items`
--
ALTER TABLE `video_request_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=70;

--
-- AUTO_INCREMENT de tabela `withdrawals`
--
ALTER TABLE `withdrawals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
