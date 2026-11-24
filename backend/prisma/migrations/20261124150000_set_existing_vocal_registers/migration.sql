UPDATE "Profile" AS p
SET "vocalRegister" = CASE u.username
  WHEN 'rodrysalsa' THEN 'Tenor'
  WHEN 'guadalupita' THEN 'Soprano'
END
FROM "User" AS u
WHERE p."userId" = u.id
  AND u.username IN ('rodrysalsa', 'guadalupita');