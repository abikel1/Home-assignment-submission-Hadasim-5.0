-- אבא
INSERT INTO Relatives (Person_Id, Relative_Id, Connection_Type)
SELECT Person_Id, Father_Id, 'אב'
FROM Persons
WHERE Father_Id IS NOT NULL;

-- אמא
INSERT INTO Relatives (Person_Id, Relative_Id, Connection_Type)
SELECT Person_Id, Mother_Id, 'אם'
FROM Persons
WHERE Mother_Id IS NOT NULL;

-- בן/בת זוג
INSERT INTO Relatives (Person_Id, Relative_Id, Connection_Type)
SELECT Person_Id, Spouse_Id, CASE Gender WHEN 'זכר' THEN 'בן זוג' ELSE 'בת זוג' END
FROM Persons
WHERE Spouse_Id IS NOT NULL;

-- אחים ואחיות (משותפים באב או אם)
INSERT INTO Relatives (Person_Id, Relative_Id, Connection_Type)
SELECT P1.Person_Id, P2.Person_Id, CASE P2.Gender WHEN 'זכר' THEN 'אח' ELSE 'אחות' END 
FROM Persons P1
JOIN Persons P2 ON P1.Person_Id <> P2.Person_Id
 AND ((P1.Father_Id IS NOT NULL AND P1.Father_Id = P2.Father_Id) OR (P1.Mother_Id IS NOT NULL AND P1.Mother_Id = P2.Mother_Id)); 

-- בן/בת (מילדים להורים)
INSERT INTO Relatives (Person_Id, Relative_Id, Connection_Type)
SELECT p.Person_Id, c.Person_Id, CASE WHEN c.Gender = 'זכר' THEN 'בן' ELSE 'בת' END
FROM Persons p
JOIN Persons c ON p.Person_Id IN (c.Father_Id, c.Mother_Id);

