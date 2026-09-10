-- 济南智慧出行 数据库结构（SQL Server）
-- 库名：jncity

-- 用户表
CREATE TABLE dbo.users (
  id            INT IDENTITY(1,1) PRIMARY KEY,
  username      NVARCHAR(50)  NOT NULL UNIQUE,   -- 登录账号
  password_hash NVARCHAR(100) NOT NULL,          -- bcrypt 加密后的密码
  created_at    DATETIME      DEFAULT GETDATE()
);

-- 站点表（公交站 + 地铁站）
CREATE TABLE dbo.stations (
  id       INT IDENTITY(1,1) PRIMARY KEY,
  objectid INT,
  name     NVARCHAR(100),
  lng      FLOAT,
  lat      FLOAT,
  area     NVARCHAR(50),
  type     NVARCHAR(20)  -- 'bus' 公交站 / 'metro' 地铁站
);

-- 交通事件表（事故/施工/拥堵/管制，用户上报）
CREATE TABLE dbo.events (
  id          INT IDENTITY(1,1) PRIMARY KEY,
  type        NVARCHAR(20)  NOT NULL,   -- accident事故 / construction施工 / congestion拥堵 / control管制
  level       INT           DEFAULT 2,  -- 1一般 / 2较重 / 3严重
  lng         FLOAT         NOT NULL,
  lat         FLOAT         NOT NULL,
  address     NVARCHAR(200),
  description NVARCHAR(500),
  username    NVARCHAR(50),
  created_at  DATETIME      DEFAULT GETDATE()
);
