DECLARE @AdminEmail nvarchar(max) = N'admin@matateni.com';
DECLARE @AdminPassword nvarchar(max) = N'demo123';
DECLARE @AdminFullName nvarchar(max) = N'Matateni Admin';
DECLARE @AdminRole int = 2;

IF EXISTS (SELECT 1 FROM [User] WHERE LOWER([Email]) = LOWER(@AdminEmail))
BEGIN
    UPDATE [User]
    SET
        [FullName] = @AdminFullName,
        [Password] = @AdminPassword,
        [Role] = @AdminRole,
        [DepartmentId] = NULL
    WHERE LOWER([Email]) = LOWER(@AdminEmail);
END
ELSE
BEGIN
    INSERT INTO [User] (
        [Id],
        [FullName],
        [Email],
        [Password],
        [Role],
        [DepartmentId],
        [CreatedAt]
    )
    VALUES (
        CONVERT(nvarchar(450), NEWID()),
        @AdminFullName,
        @AdminEmail,
        @AdminPassword,
        @AdminRole,
        NULL,
        SYSUTCDATETIME()
    );
END

SELECT [Id], [FullName], [Email], [Role], [CreatedAt]
FROM [User]
WHERE LOWER([Email]) = LOWER(@AdminEmail);
