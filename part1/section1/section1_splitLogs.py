from collections import Counter
import heapq

#קריאה של 10,000 שורות בכל פעם
def read_parts(file_path, part_size=10000):
    with open(file_path, 'r', encoding='utf-8') as file:
        part = []
        for line in file:
            part.append(line.strip())#מוסיפים כל שורה לpart
            if len(part) == part_size:#בודקים אם גודל הpart שווה ל10000
                yield part#מחזירים את הpart
                part = []
        if part:#בסיום הקובץ אם נשאר פחות מ10000 מחזירים גם אותם
            yield part

# עיבוד כל חלק וספירת קודי השגיאה בו
def count_errors(part):
    error_counter = Counter()#מילון מיוחג שמיועד לספירה 
    for line in part:
        error_code = parse_error(line)#חילוף הקוד שגיאה
        if error_code:
            error_counter[error_code] += 1
    return error_counter

# חילוף קוד שגיאה מתוך שורה בקובץ
def parse_error(line):
    # חיפוש המילה "Error:" והשגת המילה שבאה אחרי זה (הקוד שגיאה)
    if "Error:" in line:
        parts = line.split(",")  # נניח שיש פסיק בין ה-Timestamp לקוד השגיאה
        for part in parts:
            if "Error:" in part:
                # קטע שאחריו יש את הקוד שגיאה
                error_code = part.split("Error:")[1].strip()
                # מסירים גרשיים אם קיימים
                error_code = error_code.replace('"', '')
                return error_code
    return None

# איחוד כל ה־Counters לחישוב כולל
def merge_counts(counters):
    total_counter = Counter()
    for counter in counters:
        total_counter.update(counter)
    return total_counter

def top_errors(counter, N):
    # מסדרים את המילון לפי הערכים (הספירות) בסדר יורד
    sorted_errors = heapq.nlargest(N, counter.items(), key=lambda x: x[1])
    return sorted_errors[:N]
# קבלת N השגיאות השכיחות ביותר
def get_top_n_errors(file_path, N):
    partial_counters = []
    for part in read_parts(file_path):
        counter = count_errors(part)
        partial_counters.append(counter)
    total_counts = merge_counts(partial_counters)
    return top_errors(total_counts,N)

if __name__ == "__main__":
    file_path = "c:/Hadasim5Project/part1/section1/logs.txt"
    N = 5  # מספר השגיאות השכיחות ביותר
    top_errors = get_top_n_errors(file_path, N)
    for code, count in top_errors:
        print(f"{code}: {count}")

# K מספק השורות
# M-אורך שורה-מספר קטן ולא נחשב
# S-מספר סוגי השגיאות
#read_parts - מעבר על כל השורות בקובץ- O(K)
#parse_error-  מעבר על כל המילים בשורה אחת- O(M)
#count_errorst- מעבר על כל המילים בכל חלק כאשר בכל חלק יש 10000 שורות - O(10000*M)=Oׂ(M)-חלק בודד-
#הכל ביחד יצא - O(K*M)-M מספר קטן ולכן - O(K)
#merge_counts- מיזוג -Oׂ(S)
#top_errors-לקיחת N איברים הכי גדולים- O(SlogN)- במקרה הגרוע כל שורה תיהיה סוג אחר וזה יצא KlogN
#לכן סהכ זמן הריצה יהיה O(K) 
#בעצם מה שהכי כבד פה זה המעבר על כל הקובץ
#
#
#סיבוכיות מקום זה המשתנים שנשמרים במהלך התוכנית
# לכן O(10000) בכל פעם נשמר מקום לחלק בגודל 10000
#partial_counters-כל counter מכיל עד S שגיאות- T מספר החלקים- O(S*T)
# total_counter-מאחסן את ספירת כל סוגי השגיאות- O(S)
#top_errors- רשימת N שגיאות הכי נפוצות- O(N)