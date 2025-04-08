INSERT INTO Relatives (Person_Id, Relative_Id, Connection_Type)
SELECT r.Relative_Id, r.Person_Id, CASE p.Gender WHEN 'זכר' THEN 'בת זוג' ELSE 'בן זוג' END
FROM Relatives r
JOIN Persons p ON r.Person_Id = p.Person_Id
LEFT JOIN Relatives r2  ON r2.Person_Id = r.Relative_Id AND r2.Relative_Id = r.Person_Id AND r2.Connection_Type IN ('בן זוג', 'בת זוג')
WHERE r.Connection_Type IN ('בן זוג', 'בת זוג')  AND r2.Person_Id IS NULL;
