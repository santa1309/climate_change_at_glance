###########################################
# Average Daily rain Calculation (50 years)
############################################
import os
import xarray as xr
import rasterio
from rasterio.transform import from_origin
import pandas as pd
import numpy as np
from datetime import timedelta

# Open the already downloaded yearly rain data (NetCDF)
# folder = r'F:\Drought\IMD Data\IMD_rain_Data\*.nc'  # rain data 1971 to 2020 is located in the folder
# data = xr.open_mfdataset(folder, parallel=True)

############################################
# Step 1: Load and preprocess data
############################################
start_date = '01-01-1961'
end_date = '01-12-2010'


# data = data.sel(time = slice(start_date,end_date))
# print(data.time)

# Extract the 'rain' variable and the 'time' dimension
rain_data = data.rain
rain_data = rain_data.fillna(-999)
# Convert the time coordinate to pandas datetime for easier manipulation
rain_data.coords['time'] = pd.to_datetime(rain_data.coords['time'].values)
rain_data['year'] = rain_data.time.dt.year

# Determine if the year is a leap year
is_leap_year = rain_data.time.dt.is_leap_year

# Separate the data into leap and non-leap years
non_leap_years = rain_data.sel(time=~is_leap_year)
leap_years = rain_data.sel(time=is_leap_year)

############################################
# Step 2: Calculate daily averages
############################################

# Step 2: Calculate daily averages for non-leap and leap years
daily_mean_rain_non_leap = non_leap_years.groupby('time.dayofyear').mean(dim='time')
daily_mean_rain_leap = leap_years.groupby('time.dayofyear').mean(dim='time')

# Handle the leap years: remove Feb 29 from leap years to match non-leap year days
daily_mean_rain_leap_ex_feb29 = daily_mean_rain_leap.drop_sel(dayofyear=59)

# Reindex leap year data (removes Feb 29, makes it 365 days)
daily_mean_rain_leap_ex_feb29 = daily_mean_rain_leap_ex_feb29.assign_coords(
    dayofyear=('dayofyear', np.arange(1, 366))  # New dayofyear range from 1 to 365
)

# Align leap and non-leap year data
daily_mean_rain_leap, daily_mean_rain_leap_ex_feb29 = xr.align(
    daily_mean_rain_leap, daily_mean_rain_leap_ex_feb29
)

# Calculate the average daily rain (for both leap and non-leap years)
final_daily_mean_rain = (daily_mean_rain_leap_ex_feb29 + daily_mean_rain_non_leap) / 2

# Extract Feb 29 data separately from leap years
feb_29_mean = daily_mean_rain_leap.sel(dayofyear=59)

# Ensure Feb 29 data has the same dimensions as the final dataset
feb_29_mean = feb_29_mean.expand_dims(dim="dayofyear").assign_coords(dayofyear=[59])

# Concatenate final daily mean rain with Feb 29 (inserting it at the correct position)
final_mean_rain_all_days = xr.concat(
    [
        final_daily_mean_rain.sel(dayofyear=slice(1, 58)),  # Days before Feb 29
        feb_29_mean,  # Feb 29
        final_daily_mean_rain.sel(dayofyear=slice(59, 365))  # Days after Feb 29
    ],
    dim="dayofyear"
)

# Reindex to create a full year (1 to 366)
final_mean_rain_all_days = final_mean_rain_all_days.assign_coords(
    dayofyear=('dayofyear', np.arange(1, 367))
)

# Print the 'dayofyear' values to verify
# print(final_mean_rain_all_days.dayofyear.values)

# Rename the time dimension to 'DAY_OF_YEAR' to avoid confusion 
final_mean_rain_all_days = final_mean_rain_all_days.rename({'dayofyear': 'DAY_OF_YEAR'})
final_mean_rain_all_days = final_mean_rain_all_days.where(final_mean_rain_all_days>=0)

############################################
# Step 3: Save results as GeoTIFF
############################################
print(final_mean_rain_all_days)

