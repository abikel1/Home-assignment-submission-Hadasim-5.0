import pandas as pd
import os
import glob

# קריאת הקובץ והכנה לעיבוד (כולל המרת פורמט התאריך)
def read_data(file_path):
    df = pd.read_excel(file_path)
    # המרת עמודת timestamp לפורמט תאריך ושעה
    df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
    return df

# ניקוי נתונים
def clean_data(df):
    # הסרת כפילויות לפי Timestamp
    df = df.drop_duplicates()
    # הסרת שורות עם ערכים חסרים
    df = df.dropna(subset=['value'])
    # הסרת שורות בהן הערך ב- 'value' לא תקין
    df = df[pd.to_numeric(df['value'], errors='coerce').notnull()]
    return df

#חלוקת הדאטה לפי ימים ושמירה בקבצים
def split_by_date_and_save(df, folder):
    #יצירת עמודה חדשה עם תאריך
    df['date'] = df['timestamp'].dt.date
#חילוק הדאטה לפי תאריכים
    grouped = df.groupby('date')
    if not os.path.exists(folder):
        os.makedirs(folder)
    # לולאה על כל תאריך והקבוצה של השורות שקשורות אליו.
    for date, group in grouped:
        #יוצר שם קובץ לפי התאריך 
        file_name = f"time_series_{date}.csv"
        full_path = os.path.join(folder, file_name)
        #שומר את הקבוצה לקובץ CSV בלי עמודת date
        group.drop(columns='date').to_csv(full_path, index=False)

# חישוב ממוצע שעתי לכל קובץ קטן בתיקייה
def calculate_hourly_averages_from_folder(folder):
    results = []
    #לולאה על כל קובץ בתיקייה
    for file_path in glob.glob(os.path.join(folder, 'time_series_*.csv')):
        #קריאה של הקובץ לקובץ טבלה (DataFrame)
        df = pd.read_csv(file_path, parse_dates=['timestamp'])
        #יצירת עמודה חדשה שמעגלת את השעה
        df['Hour'] = df['timestamp'].dt.floor('h')
        #מחשב ממוצע לפי שעה
        hourly_avg = df.groupby('Hour')['value'].mean().reset_index()
        hourly_avg.columns = ['Timestamp', 'Average']
        #מוסיף את תוצאת הממוצעים השעתיים לרשימה.
        results.append(hourly_avg)
    return results

# איחוד כל התוצאות
def combine_all_hourly_averages(results):
    #מאחד את כל הטבלאות ברשימה לטבלה אחת
    combined_df = pd.concat(results, ignore_index=True)
    #מיון לפי עמודת זמן
    combined_df = combined_df.sort_values(by='Timestamp')
    return combined_df

#  שמירת התוצאה הסופית
def save_final_results(df, output_file):
    df.to_csv(output_file, index=False)

def process_large_time_series(file_path, split_folder, output_file):
    df = read_data(file_path)
    df_clean = clean_data(df)
    split_by_date_and_save(df_clean, split_folder)
    results = calculate_hourly_averages_from_folder(split_folder)
    final_df = combine_all_hourly_averages(results)
    save_final_results(final_df, output_file)

file_path = 'c:/Hadasim5Project/part1/section2/time_series.xlsx'
split_folder = 'c:/Hadasim5Project/part1/section2/split_files'
output_file = 'c:/Hadasim5Project/part1/section2/final_hourly_averages.csv'

process_large_time_series(file_path, split_folder, output_file)