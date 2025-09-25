# A3 Critical User Journey (CUJ) Runthrough

## Team Constellations

Team: k.ai

Group Members:

* James Chen – 1008002135
* Kevin Hu – 1008866817
* Ali Eren Kaya – 1007315736
* Monique Mattia (CSC454) – 1005841341
* Yvonne Zhang – 1008752333


**Submission Date:** 2025/09/24

## ⚡ TL;DR
To add

---

## 🎯 Goal

**To add **

## 🧰 Tools Used

* 

## 🧑‍💻 Persona Description

To add

## 📘 Summary of Findings

To add

## 💡 Recommendations

**For Meta Graph API (Product Improvements):**

* 

**For Future Users:**

* 

---

## Highlights & Lowlights Table

| Task | Severity | Notes |
| ----- | ----- | ----- |
|  |  |  |

---

 ## CUJ Overview Table

| Task | Time | Switches |
| ----- | ----- | ----- |
|  |  min |  |

**Total Time:** 
**Total Context Switches:** 

## Full CUJ Table (Step-by-Step Documentation)

| Step | Notes (What \+ Why) | Screenshot |
| ----- | ----- | ----- |
| 1 | Googled Graph API to access "First Request" documentation | ![ss1.png](./assets/ss1.png) |
| 2 | Clicked on official documentation and navigated to "Get Started" | ![ss2.png](./assets/ss2.png) |
| 3 (switch) | Reviewed Requirements: Identified what's not met |  |
| 4 | Moved to "Register as a Meta Developer" page | ![ss3.png](./assets/ss3.png) |
| 5 | Followed the link for registration and verification | ![ss4.png](./assets/ss4.png) |
| 6 | At the verification step, UI threw an error stating mobile number verification can only be completed through the Accounts Center | ![ss5.png](./assets/ss5.png) |
| 7 | Link to Accounts Center does not work |  |
| 8 | Manually navigate to Facebook > Accounts Center |  |
| 9 | Open up accounts center and complete verification request |  |
| 10 | Receive SMS and provide it for complete verification |  |
| 11 | Confirm email for Meta Developer account | ![ss6.png](./assets/ss6.png) |
| 12 | Finalize account creation by choosing a category that best describes the user type | ![ss7.png](./assets/ss7.png) |
| 13 | Automatically switch to Meta Apps page |  |
| 14 | Refer back to documentation and verify next requirement | ![ss8.png](./assets/ss8.png) |
| 15 | Navigate back to Meta Apps page |  |
| 16 | Click create app and name the app and verify app email | ![ss9.png](./assets/ss9.png) |
| 17 | Choose suitable use cases and specify businesses and requirements | ![ss10.png](./assets/ss10.png) |
| 18 | Review and create the app | ![ss11.png](./assets/ss11.png) |
| 19 (switch) | Switch back to documentation for "First Request" | ![ss12.png](./assets/ss12.png) |
| 20 (switch) | Open Graph API Explorer tool | ![ss13.png](./assets/ss13.png) |
| 21 | Generate Access Token | ![ss14.png](./assets/ss14.png) |
| 22 | Click submit and receive the response for the first API call | ![ss15.png](./assets/ss15.png) |
| 23 | Refer back to documentation for next call and navigate back to API Explorer tool | ![ss16.png](./assets/ss16.png) |
| 24 | Hover over to the node tab and search the field "email" | ![ss17.png](./assets/ss17.png) |
| 25 | Submit again and receive the error that states we require the allocation of a permission that involves email permissions | ![ss18.png](./assets/ss18.png) |
| 26 | Because user cannot find the asked permissions in the permissions search field, start debugging the scenario | ![ss19.png](./assets/ss19.png) |
| 27 | Google why user might not have access to User Data Permissions since email requires this set of permissions |  |
| 28 | After a series of searches, user decides that this situation might be triggered by the choice of use cases when creating the Meta App |  |
| 29 | Navigate back to the Apps page and create an app from scratch | ![ss20.png](./assets/ss20.png) |
| 30 | Follow the app creation dialogue but specify the use case as "No Use Case" |  |
| 31 | After finalizing app creation, add email permissions under User Data Permissions | ![ss21.png](./assets/ss21.png) |
| 32 | Add email field under the node tab |  |
| 33 | Generate Access Token |  |
| 34 | Click submit and receive the response body with id, name, and email | ![ss22.png](./assets/ss22.png) |
