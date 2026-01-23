"""
Zoom Transcript Downloader - FIXED VERSION
Downloads ONLY transcript files (.vtt) from Zoom recordings

Installation:
    pip install selenium
    
Run:
    python download_zoom_transcripts_fixed.py
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from selenium.webdriver.common.action_chains import ActionChains
import time
import os

# Base download folder
BASE_FOLDER = os.path.expanduser("~/Documents/GitHub/tayai-project/backend/data/sources/zoom_transcripts")

# Create category folders
CATEGORIES = [
    "Master Hair Industry Challenge",
    "TLA Mentorship Lessons",
    "Round 3 Mentorship",
    "Round 4 Waitlist & Mentorship",
    "Guest Speaker Sessions",
    "Free Masterclasses",
    "Round 5 Launch Lessons",
    "Round 5 Mentorship",
    "Round 5 Guest Speaker Sessions"
]

for category in CATEGORIES:
    os.makedirs(os.path.join(BASE_FOLDER, category), exist_ok=True)

# All recordings organized by category
recordings = [
    # Master Hair Industry Challenge (October 2024)
    {"category": "Master Hair Industry Challenge", "name": "Day1_Oct07_2024", "url": "https://us06web.zoom.us/rec/share/HXNIQgXBNNqh2Uz33JXWW4eeLuU7lIVuUYyc-f5hEcFPzW1c2nqMM2uFGLMf0ZM.LUHaqTW0-CreYUp0", "passcode": "@L18G7DY"},
    {"category": "Master Hair Industry Challenge", "name": "Day2_Oct09_2024", "url": "https://us06web.zoom.us/rec/share/E5cmHNj9vpkmgSN6cy7R9ReOk6A0wK65y7DWkDL1TteOCnn1s_hM2txugbEv61LW.JVv_MUIxobngF9Pn", "passcode": "nA40i?=2"},
    {"category": "Master Hair Industry Challenge", "name": "Day3_Oct10_2024", "url": "https://us06web.zoom.us/rec/share/d1B5FtjvAZvB_Zdh8ZrcC7-XAhPd94kkbTov1Wn47LTIRk5VhypITO2cBk5ul1ep.KN5SO5fIOHOCVQk_", "passcode": "Y^0%Fi0P"},
    {"category": "Master Hair Industry Challenge", "name": "Day4_Oct11_2024", "url": "https://us06web.zoom.us/rec/share/Z4YESb5MLX5MjkfsogkxMQ19ekKeiNLCLjQwjA8aA8akkdttyDJ3oBZ4lgA71voE.lqmzQfhJPqAJTXlL", "passcode": "wup7D@=w"},
    {"category": "Master Hair Industry Challenge", "name": "Day5_Oct12_2024", "url": "https://us06web.zoom.us/rec/share/x6O5u6q2mLcaAaEnBgvmkhwCTJA54G80Z8ZSPUKwYFgQ9pquBmkDVOvxVrnJrJSB.gldIl8KcTKquWk8Q", "passcode": "5%#URkAx"},
    
    # TLA Mentorship Lessons (November 2024 - February 2025)
    {"category": "TLA Mentorship Lessons", "name": "Week1_Nov12_2024", "url": "https://us06web.zoom.us/rec/share/XPI1LtXkYhzFTcoEVSTW3OZnS1UjrHNEWy2otVIm0f2NfGVlZJ7UXl7n0us9M0Gg.OmvPa1fZhKk5S3Af", "passcode": "X@2hA21H"},
    {"category": "TLA Mentorship Lessons", "name": "Lesson2_Nov17_2024", "url": "https://us06web.zoom.us/rec/share/APfvo9SiHEutz9D_tLSUISj9ikLc3TWHVVE118qZtdrbLXg9kR-GViyfF_odvs0.-fT8QDNX-4JSusfB", "passcode": "pVN+%@!0"},
    {"category": "TLA Mentorship Lessons", "name": "Weekly_Dec09_2024", "url": "https://us06web.zoom.us/rec/share/qbDNpfjHNEmcPpGb82U5OJcdTth7KvXGhBHaRR1WtlssisIUDWN04J4oku8tXaIz.K4ju-wWV1PaX4ufr", "passcode": "XMXd6$R1"},
    {"category": "TLA Mentorship Lessons", "name": "RecapQA_Dec15_2024", "url": "https://us06web.zoom.us/rec/share/TGdPekUzSUKHYeddt0SiyYx5uVCRqUXknmECIXAmbcVG2_x6xjIT0qRitg8IY14v.1hJ0ARGS-lffS7kR", "passcode": "cktgz2"},
    {"category": "TLA Mentorship Lessons", "name": "Weekly_Dec16_2024", "url": "https://us06web.zoom.us/rec/share/zcw1WE-orQw9dhcoc2nla_w10_UWkQfCn_bAGXuBeBE-pxPOodyQJ8BPK9Hamy-8.hvYFVk_EkDUl1efW", "passcode": "v1^kq0!Y"},
    {"category": "TLA Mentorship Lessons", "name": "Weekly_Jan06_2025", "url": "https://us06web.zoom.us/rec/share/RGqKuiI--af7yJLsXQVa4g_zWGyyj_xz430AJDCS-XTap2BGzHY1d9FXpAySFd6t.76tH9RXhzTk5fLkf", "passcode": "688d#5cM"},
    {"category": "TLA Mentorship Lessons", "name": "Weekly_Jan14_2025", "url": "https://us06web.zoom.us/rec/share/tP2PWQW3gJubJ_JgnzRQ0w7O2GFzAOZoTlsss3Lmxkgkt7K5xPK22zPgLQo-hqdV.de1aJjH31UTE3Mep", "passcode": "*0Dr=a+E"},
    {"category": "TLA Mentorship Lessons", "name": "Weekly_Jan20_2025", "url": "https://us06web.zoom.us/rec/share/fne-i5icHX26Vi6Nq_6f94uwTIpsuzjOOxmfiNiYFkym4-9S9vE062qVXdPHsoIS.cHasaseExODcneGL", "passcode": "Jj8N$&88"},
    {"category": "TLA Mentorship Lessons", "name": "Weekly_Jan28_2025", "url": "https://us06web.zoom.us/rec/share/h3yYnBMZFosi1QRlAx2CZl588HfLuW8CtWg4XEgLotUrqozG2mE8BIedzCBSDnyG.LRsI5hWchUoC1qfn", "passcode": "q$Ha6wqV"},
    {"category": "TLA Mentorship Lessons", "name": "Weekly_Feb03_2025", "url": "https://us06web.zoom.us/rec/share/ucfwVawwVdX3Tu0ugI8db_1q1wRSYD1Qg4gDUflk5dx_WQHDp72ATwIbd5YeVtJF.3I6KACeMr5S-SXwZ", "passcode": "HctfAV2&"},
    
    # Round 3 Mentorship (March - April 2025)
    {"category": "Round 3 Mentorship", "name": "Weekly_Mar10_2025", "url": "https://us06web.zoom.us/rec/share/u02ZZz_rDGkPsmH9ZTigApOpRazLXoISd6kQxJt-dIg8fQtCK6s6zj_dJwUWAHQ.0U9N8NKk9UdIF6Gh", "passcode": "6#h1D3%M"},
    {"category": "Round 3 Mentorship", "name": "Weekly_Mar17_2025", "url": "https://us06web.zoom.us/rec/share/81Sx-pr95GSYq0qfylh7F9vE6RyA5YywBCOzbBhfTaaWoB-fDWuopac6kfVt7Bna.kffjMXijjJtlCyxJ", "passcode": "5=iq*+CV"},
    {"category": "Round 3 Mentorship", "name": "Weekly_Mar25_2025", "url": "https://us06web.zoom.us/rec/share/FbtnLMWzcO6cffRFBRYa7xWCZ1vW-GJJ7mWsq03hFh1o9iNum4vND_N5ke_SjVeH.FpoNNAVt9MA3S_8X", "passcode": "aqN5u=D?"},
    {"category": "Round 3 Mentorship", "name": "BusinessFunding_Mar29_2025", "url": "https://us06web.zoom.us/rec/share/vh5cgnrI6s90lLWXzsTglr-ilfsvCSEt3q--tNGnbSaje8th_ZlRmver7GGp4oIL.1JyLs0n_mTr1bVZg", "passcode": "+01c?s7N"},
    {"category": "Round 3 Mentorship", "name": "Weekly_Apr07_2025", "url": "https://us06web.zoom.us/rec/share/iP5mv1BY5TKaffOKcaTNOu-yJJ7QQNNG1kmULlUQz13mqh7KWecl_bKVGFoFveQ6.ywDLjLLBdZ11oqF8", "passcode": "p%kg15$j"},
    {"category": "Round 3 Mentorship", "name": "Weekly_Apr14_2025", "url": "https://us06web.zoom.us/rec/share/UpoUSwMC1V3B_R6z9vcxZk24hPNzOzlVB_AWDmVAAwtNFFAnu2axWoquSd4ph2c.wL0rbYwppIE-x38a", "passcode": "7e.Bj.i."},
    
    # Round 4 Waitlist & Mentorship (June - July 2025)
    {"category": "Round 4 Waitlist & Mentorship", "name": "Waitlist_Jun07_2025", "url": "https://us06web.zoom.us/rec/share/MlN4ah4hUmyx08eGxchWIfQGkSNH530rdFTWZ_ro80Zbqr4NALvOn9o770dp5e-V.6eWb6qdRC_whT32I", "passcode": "27D%&1dP"},
    {"category": "Round 4 Waitlist & Mentorship", "name": "Waitlist_Jun13_2025", "url": "https://us06web.zoom.us/rec/share/aG60nNiJxw3nVUNecAQuBpkBLq4GuA9xbl3VzDD7awFPRYjluVyQVl1sgUL8ASem.cdaWH886hOiKDD9F", "passcode": "3gTArve$"},
    {"category": "Round 4 Waitlist & Mentorship", "name": "Weekly_Jun23_2025", "url": "https://us06web.zoom.us/rec/share/z-e14gxZeqGuywYrAkcsNIC0RJCmk3-njDsx4bcefAqiPkPcz69hKJuZnywB93tX.HjcBeQhjc-kYnMXh", "passcode": ".a==54Xe"},
    {"category": "Round 4 Waitlist & Mentorship", "name": "Weekly_Jun30_2025", "url": "https://us06web.zoom.us/rec/share/yPwUkaW91Gkf-Nqj6q4ZSuY3c6yu9KuhdganREt0pjs4ZVIl6zesKNx3iuEElmUr.EzL7YbkHOOgICozr", "passcode": "m1H?5kjH"},
    {"category": "Round 4 Waitlist & Mentorship", "name": "Weekly_Jul13_2025", "url": "https://us06web.zoom.us/rec/share/xFU7B9k6not6PmYTR--484qKWGxYd1IUmQ25HVzkxM0okOSZxf5ybZxsajm0eB-3.bcQxl2RyE21iO6qE", "passcode": "+V?k3BpP"},
    {"category": "Round 4 Waitlist & Mentorship", "name": "Weekly_Jul21_2025", "url": "https://us06web.zoom.us/rec/share/Cm1lxTsp0BGB3XRO47twmfZDxOCv6yjVDc6QV0CRTKtraGZJgQ3Ogw_jAdUCPtKX.K-JJCWki9Xng4DmZ", "passcode": "RCH^17=I"},
    {"category": "Round 4 Waitlist & Mentorship", "name": "Weekly_Jul27_2025", "url": "https://us06web.zoom.us/rec/share/bk7V3ZHeZaReBvRFifMzUxJAKgqPaP-EkJ8klUObGhTVe6Qtr0G-4ZT8rZq8neLF.1fK6dXH8ve5qR3e2", "passcode": "Gh!+T.5W"},
    
    # Guest Speaker Sessions (July 2025)
    {"category": "Guest Speaker Sessions", "name": "KamrynGibson_Jul01_2025_8PM", "url": "https://us06web.zoom.us/rec/share/YmT7w79TL4q-NZoiG-7w-kX9ZoNO6vfl6svKReLhaKIYXiMwKwyWIiIcj14KRygB.ImR8dsFs9L1ijez1", "passcode": "7!@veZ2T"},
    {"category": "Guest Speaker Sessions", "name": "BennieDadzie_Jul01_2025_9PM", "url": "https://us06web.zoom.us/rec/share/i5G9l-7-Gq_V1AZHrMcRX6qEkB5JWLgLyW4VU-iRwKUgDPhPZQCxn_j43luJ-iiz.DFOEwjxZpcWE-Tk_", "passcode": "gK0KJL4="},
    {"category": "Guest Speaker Sessions", "name": "BennieDadzie_Jul03_2025_2PM", "url": "https://us06web.zoom.us/rec/share/_p7qS3EjbmnD1SejWAa3WXTIztAU0_JglKuzK-oGRQ7qikYL_fJPQ4HraEdiy6mL.dYtnpsYf3r86rpDh", "passcode": "B4rJ0U0="},
    {"category": "Guest Speaker Sessions", "name": "KamrynGibson_Jul03_2025_8PM", "url": "https://us06web.zoom.us/rec/share/kPfCONdznCDOGsXhQJY_wMbUi-sZOByY1Aa5ZhvcQKh9bOR7k313dkoQCKGNlEsF.NgJDgpd1wPzYbMqa", "passcode": "hS6vK!b."},
    {"category": "Guest Speaker Sessions", "name": "AKIA_Jul03_2025", "url": "https://us06web.zoom.us/rec/share/EWMFhMAzFt0Ts_OOBh9gwEvXW--zwR0YN1qjKQZ-8zipe6Go9gRSjtZZ2eIDOKbl.LSJfIfgrNqYZ9S5_", "passcode": "Dx4J^KU@"},
    {"category": "Guest Speaker Sessions", "name": "DiliaJohnson_Jul08_2025", "url": "https://us06web.zoom.us/rec/share/cUlPcqwqKZVrCWijE2sHmX9B1YfUUfHVwMiuMzSAg7NdSxOAdvV5tfVe2mIJzWY-.cvnYLCDXBVMJA6NR", "passcode": "#37Tv7U!"},
    {"category": "Guest Speaker Sessions", "name": "KEY_Jul19_2025", "url": "https://us06web.zoom.us/rec/share/w8yzSi05FfgavHfJb0-hrq6oH6XmNThtpjBeKQFkb38Kx6K-kuNUk-ubN-99j1WS.0mGCAq1juXR98GEU", "passcode": "Whv$Pv5N"},
    {"category": "Guest Speaker Sessions", "name": "BeautyLinkMeeting_Jul27_2025", "url": "https://us06web.zoom.us/rec/share/-SYRhvdvB0Sb9tQI4fWucqiPACJwt9BNyLZxOadt4Nd12I0RtCSrCmgO2YjNrnmQ.OKMAnPI99JnHtnCK", "passcode": "$.7m03=N"},
    
    # Free Masterclasses (October - November 2025)
    {"category": "Free Masterclasses", "name": "HowToMaster_Oct17_2025", "url": "https://us06web.zoom.us/rec/share/RIjKJwnqrNWc94wkodUdIWV8PhW7AR3Q1vEqxphB9jVyfg9MsbpmImmPTfPepg3t.Pq-vbl55LiKFgeDZ", "passcode": "+n5Z#?cH"},
    {"category": "Free Masterclasses", "name": "MasterHairIndustry_Oct24_2025", "url": "https://us06web.zoom.us/rec/share/GZH4lPyrL2rTtztlGSoI1vXgWiax2bFxgmOXbXtFwyzn6635ofTU4B-2Av9ulOaj.fXq-qiAHZ9QV9ouj", "passcode": ""},
    
    # Round 5 Launch Lessons (November 2025)
    {"category": "Round 5 Launch Lessons", "name": "Lesson1_BuildingBrand_Nov03_2025", "url": "https://us06web.zoom.us/rec/share/gKo41S5gHPCtAL2ezGGqIizDVHjqTifsimBd7Vi0wO5SKbJYGUbxG29KUVFT_W5C.C9NWPZJudIn8sPEO", "passcode": "GkNv3k"},
    {"category": "Round 5 Launch Lessons", "name": "Lesson2_ProfitablePath_Nov04_2025", "url": "https://us06web.zoom.us/rec/share/ZzdvELlbJM1sa7jfKKtVHYP_0zehdNl9yF62G9eNvFSYzQkW3eej49aSQFQY86k0.ZU5K9Z2NuG0UA_bi", "passcode": "R$v=5PnW"},
    {"category": "Round 5 Launch Lessons", "name": "Lesson3_VisibilityGap_Nov05_2025", "url": "https://us06web.zoom.us/rec/share/TmkFNIpatnFRaLCtI5PlX7Mud2sIeR7KBo42Z8viZR5cVP65B4Qe5wK3Qfu7OFE.z_XO4T3TD9LXvWrV", "passcode": "U5TgjRe="},
    {"category": "Round 5 Launch Lessons", "name": "Lesson4_PackagingSkill_Nov06_2025", "url": "https://us06web.zoom.us/rec/share/xwjT843Yf0PlqRodM0BOHmZ2DMXHsdWL7MI6eT6h6Fywd6kmaq7oG7nKj-elKSE.KDUdQ-3Dw3keRya-", "passcode": "%=52Y7gJ"},
    {"category": "Round 5 Launch Lessons", "name": "Lesson5_MissingPiece_Nov07_2025", "url": "https://us06web.zoom.us/rec/share/2H0nYy-2rgfuHHpyKFy2laNTObzF0hpeKm8iPJCSqftqG1S4FAnGR4s7C7VMYefB.IHf-pkBvmmE-SvRA", "passcode": "b.p9dYt$"},
    
    # Round 5 Mentorship (November - December 2025)
    {"category": "Round 5 Mentorship", "name": "Week1_Nov30_2025", "url": "https://us06web.zoom.us/rec/share/Rh9z0A7Wkyw79dXsMTcvtofVmP_uO_CV8Q9UVALvW4ofCNsSTzgTsYzbjJ2FPFQH.5gOPfzo3MBi1-Dy2", "passcode": "$7&E60ml"},
    {"category": "Round 5 Mentorship", "name": "Week2_Dec07_2025", "url": "https://us06web.zoom.us/rec/share/ORPw_thGlm37cVrVtkruDvLV3huK1fPunQSMdcB9vCzIrfdeZv7dZGfLuEmzLEk.I2yyIEAWLUNLjs3-", "passcode": "Fz2*ACwZ"},
    
    # Round 5 Guest Speaker Sessions (December 2025)
    {"category": "Round 5 Guest Speaker Sessions", "name": "JackaeJohnson_Dec03_2025_8PM", "url": "https://us06web.zoom.us/rec/share/hJUUBlQ-UWr9ujwOfLy8jA9rReaRaCKKZltwhNo2VtJMIkC0N6xCv-cJ7qyKbivP.oeKhDfiSxQ_lb4eS", "passcode": "KvS6NP$E"},
    {"category": "Round 5 Guest Speaker Sessions", "name": "SantanaMckenzie_Dec03_2025_9PM", "url": "https://us06web.zoom.us/rec/share/NacwicZqwdaVrKHtgADKdjtvxVC3I3EE8Uxw4jN5yw1NwhJnc9B7pWsHS-pOcdDm.SvU6tqJAne-nWfR8", "passcode": "!En8rbJ5"},
    {"category": "Round 5 Guest Speaker Sessions", "name": "BeckyInalien_Dec10_2025_2PM", "url": "https://us06web.zoom.us/rec/share/xVnA9o5KdmifyCSBgs35Jycsuc8xyT4moUrLdFfupfKl-7N6FK2psjimjU-mG082.LEOAzw0U-5pa1FMm", "passcode": "9FU@SvsO"},
    {"category": "Round 5 Guest Speaker Sessions", "name": "ShemaiaZephyrin_Dec10_2025_2PM", "url": "https://us06web.zoom.us/rec/share/jLhQLsMaWOpZuNIZz4gCSd1TucrevWstveMt83fuUWIs6fbso1jePDkFa8O6Od91.0EXOGkUgHKEr5Sgw", "passcode": "4=7*52ZH"},
]


def setup_driver():
    """Setup Chrome driver with download preferences"""
    chrome_options = Options()
    
    # Set download preferences
    prefs = {
        "download.default_directory": BASE_FOLDER,
        "download.prompt_for_download": False,
        "download.directory_upgrade": True,
    }
    chrome_options.add_experimental_option("prefs", prefs)
    
    driver = webdriver.Chrome(options=chrome_options)
    driver.maximize_window()
    return driver


def download_transcript(driver, recording):
    """Download ONLY transcript from a Zoom recording"""
    category = recording["category"]
    name = recording["name"]
    url = recording["url"]
    passcode = recording["passcode"]
    
    print(f"\n{'='*60}")
    print(f"Category: {category}")
    print(f"Name: {name}")
    
    try:
        # Navigate to URL
        driver.get(url)
        time.sleep(4)
        
        # Enter passcode if required
        if passcode:
            try:
                passcode_input = WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.ID, "passcode"))
                )
                passcode_input.clear()
                passcode_input.send_keys(passcode)
                
                # Click submit button
                submit_btn = driver.find_element(By.ID, "passcode_btn")
                submit_btn.click()
                print(f"  ✓ Entered passcode")
                time.sleep(5)
            except TimeoutException:
                print(f"  ℹ No passcode required")
        
        # Wait for page to fully load
        time.sleep(4)
        
        # ============================================
        # METHOD: Click download dropdown, then select ONLY Audio Transcript
        # ============================================
        
        transcript_downloaded = False
        
        # Step 1: Find and click the download dropdown button
        try:
            # Look for the download button (usually has a download icon or says "Download")
            download_btn_selectors = [
                "//button[contains(@class, 'download')]",
                "//button[contains(@aria-label, 'download')]",
                "//button[contains(@aria-label, 'Download')]",
                "//*[@id='download-btn']",
                "//button[contains(text(), 'Download')]",
                "//div[contains(@class, 'download')]//button",
                "//button[contains(@class, 'zm-btn') and contains(@class, 'download')]",
            ]
            
            download_btn = None
            for selector in download_btn_selectors:
                try:
                    download_btn = WebDriverWait(driver, 3).until(
                        EC.element_to_be_clickable((By.XPATH, selector))
                    )
                    if download_btn:
                        break
                except:
                    continue
            
            if download_btn:
                download_btn.click()
                print(f"  ✓ Clicked download dropdown")
                time.sleep(2)
                
                # Step 2: Look for "Audio Transcript" option specifically
                transcript_selectors = [
                    "//*[contains(text(), 'Audio Transcript')]",
                    "//*[contains(text(), 'audio transcript')]",
                    "//*[contains(text(), 'Transcript')]",
                    "//a[contains(@href, 'transcript')]",
                    "//li[contains(text(), 'Transcript')]",
                    "//*[contains(@class, 'transcript')]",
                ]
                
                for selector in transcript_selectors:
                    try:
                        transcript_option = WebDriverWait(driver, 3).until(
                            EC.element_to_be_clickable((By.XPATH, selector))
                        )
                        if transcript_option:
                            transcript_option.click()
                            print(f"  ✓ Clicked Audio Transcript option")
                            transcript_downloaded = True
                            time.sleep(3)
                            break
                    except:
                        continue
        except Exception as e:
            print(f"  ℹ Could not find download dropdown: {e}")
        
        # ============================================
        # If automatic download didn't work, prompt for manual download
        # ============================================
        
        if not transcript_downloaded:
            print(f"\n  ⚠ MANUAL DOWNLOAD NEEDED:")
            print(f"  1. Click the download dropdown (↓ icon)")
            print(f"  2. Select 'Audio Transcript' ONLY (not video files)")
            print(f"  3. Save the .vtt file")
            print(f"  4. Move it to: {os.path.join(BASE_FOLDER, category)}")
            print(f"  5. Rename it to: {name}.vtt")
            
            input("\n  Press Enter when done (or to skip)...")
        
        return True
        
    except Exception as e:
        print(f"  ✗ Error: {str(e)}")
        return False


def main():
    print("="*70)
    print(" ZOOM TRANSCRIPT DOWNLOADER (Transcript Only)")
    print("="*70)
    print(f"\nTotal recordings: {len(recordings)}")
    print(f"Download folder: {BASE_FOLDER}")
    
    print("\n⚠️  IMPORTANT: This script downloads ONLY transcripts (.vtt)")
    print("   It will NOT download video or audio files.")
    
    print("\nCategories:")
    category_counts = {}
    for rec in recordings:
        cat = rec["category"]
        category_counts[cat] = category_counts.get(cat, 0) + 1
    
    for cat, count in category_counts.items():
        print(f"  - {cat}: {count} recordings")
    
    print("\n" + "="*70)
    print("For each recording:")
    print("1. Script opens the Zoom link")
    print("2. Enters passcode automatically")
    print("3. Tries to click Download → Audio Transcript")
    print("4. If it can't auto-download, you'll manually select transcript")
    print("="*70)
    
    input("\nPress Enter to start...")
    
    driver = setup_driver()
    successful = 0
    failed = 0
    
    try:
        for i, recording in enumerate(recordings, 1):
            print(f"\n[{i}/{len(recordings)}]")
            if download_transcript(driver, recording):
                successful += 1
            else:
                failed += 1
            
            time.sleep(2)
            
    except KeyboardInterrupt:
        print("\n\n⚠ Interrupted by user")
    finally:
        print("\n" + "="*70)
        print(" DOWNLOAD SUMMARY")
        print("="*70)
        print(f"Processed: {successful + failed}")
        print(f"Remaining: {len(recordings) - successful - failed}")
        print(f"\nTranscripts saved to: {BASE_FOLDER}")
        
        input("\nPress Enter to close browser...")
        driver.quit()


if __name__ == "__main__":
    main()