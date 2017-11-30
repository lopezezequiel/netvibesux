# -*- coding: utf-8 -*-
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import NoSuchElementException
from selenium.common.exceptions import NoAlertPresentException
import unittest, time, re, os

class All(unittest.TestCase):

    def setUp(self):

        desired_cap = {
                'os': 'Windows', 'os_version': '10', 'browser': 'IE',
                'browser_version': '11',
                'networkLogs': True,
                'browserstack.debug': True}

        self.driver = webdriver.Remote(
            command_executor=os.environ['BROWSERSTACK_AUTH'],
            desired_capabilities=desired_cap,
        )

        #self.driver = webdriver.Chrome(os.path.join(os.path.abspath(__file__), '../drivers/chromedriver'))
        self.driver.implicitly_wait(1000)
        self.base_url = "https://www.katalon.com/"
        self.verificationErrors = []
        self.accept_next_alert = True


    def by_xpath(self, xpath, seconds=60):
        for i in range(seconds):
            element = self.driver.find_element_by_xpath(xpath)

            if element:
                return element

            time.sleep(1)

        else:
            self.fail("time out")


    def test_all(self):
        driver = self.driver


        #ir al home
        driver.get("https://www.netvibes.com/en#!signin")


        #login
        time.sleep(1)
        self.by_xpath("//input[@name='email']").clear()
        driver.find_element_by_name("email").send_keys(os.environ['NETVIBES_USER'])
        self.by_xpath("//input[@name='password']").clear()
        driver.find_element_by_name("password").send_keys(os.environ['NETVIBES_PASSWORD'])
        self.by_xpath("//button[@type='submit']").click()


        #ir a la administracion
        time.sleep(2)
        driver.back()
        time.sleep(2)
        driver.get("https://www.netvibes.com/account/pages")

        #crear panel nuevo
        time.sleep(3)
        self.by_xpath("//input[@id='pageName']").click()
        self.by_xpath("//input[@id='pageName']").clear()
        self.by_xpath("//input[@id='pageName']").send_keys(int(time.time()))
        self.by_xpath("//input[@value='Crear']").click()

        #eliminar panel viejo
        self.accept_next_alert = True
        driver.find_element_by_link_text("Eliminar").click()
        try:
            self.assertRegexpMatches(self.close_alert_and_get_its_text(), "^¿Eliminar .*$")
        except:
            pass

        #ir al panel nuevo
        time.sleep(2)
        self.by_xpath('//div[@id="top"]/span[@class="topbar-left"]/a[@class="back"]').click()

        #crear nueva pestaña
        time.sleep(3)
        self.by_xpath("//a[@id='newTab']").click()
        self.by_xpath("//input[@type='text']").clear()
        self.by_xpath("//input[@type='text']").send_keys("NewTab")
        time.sleep(1)
        self.by_xpath("//input[@type='text']").send_keys(Keys.ENTER)

        #agregar modulo
        self.by_xpath("//div[@id='top']/div/div/span[2]").click()
        self.by_xpath("//div[@id='nv-panel-content']/div/div/div/div/ul/li[2]/div/ul/li[2]/ul/li[4]/div").click()
        time.sleep(1)
        self.by_xpath("//div[contains(@class,'panel-tab-module-add')]").click()


    def is_element_present(self, how, what):
        try: self.driver.find_element(by=how, value=what)
        except NoSuchElementException as e: return False
        return True

    def is_alert_present(self):
        try: self.driver.switch_to_alert()
        except NoAlertPresentException as e: return False
        return True

    def close_alert_and_get_its_text(self):
        try:
            alert = self.driver.switch_to_alert()
            alert_text = alert.text
            if self.accept_next_alert:
                alert.accept()
            else:
                alert.dismiss()
            return alert_text
        finally: self.accept_next_alert = True

    def tearDown(self):
        self.driver.quit()
        self.assertEqual([], self.verificationErrors)

if __name__ == "__main__":
    unittest.main()
