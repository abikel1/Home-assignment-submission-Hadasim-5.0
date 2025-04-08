import pandas as pd

# קריאת הקובץ והכנה לעיבוד (כולל המרת פורמט התאריך)
def read_data(file_path):
    df = pd.read_parquet(file_path)
    # המרת עמודת timestamp לפורמט תאריך ושעה
    df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
    return df

# ניקוי נתונים
def clean_data(df):
    # הסרת כפילויות לפי Timestamp
    df = df.drop_duplicates()
    # הסרת שורות עם ערכים חסרים
    df = df.dropna(subset=['mean_value'])
    # הסרת שורות בהן הערך ב- 'value' לא תקין
    df = df[pd.to_numeric(df['mean_value'], errors='coerce').notnull()]
    return df

# חישוב הממוצע עבור כל שעה
def calculate_hourly_average(df):
    # הוספת עמודת שעה (חיתוך לשעה בלבד)
    df['Hour'] = df['timestamp'].dt.floor('h')
    # חישוב הממוצע עבור כל שעה
    hourly_avg = df.groupby('Hour')['mean_value'].mean().reset_index()
    hourly_avg.columns = ['Timestamp', 'Average']
    return hourly_avg

# שמירת הנתונים המעובדים לקובץ CSV
def save_to_csv(df, output_file):
    df.to_csv(output_file, index=False)

def process_time_series(file_path, output_file):
    df = read_data(file_path)
    df_clean = clean_data(df)
    hourly_avg = calculate_hourly_average(df_clean)
    save_to_csv(hourly_avg, output_file)


file_path = 'c:/Hadasim5Project/part1/section2/time_series.parquet' 
output_file = 'c:/Hadasim5Project/part1/section2/processed_data2.4.csv'  
process_time_series(file_path, output_file)
