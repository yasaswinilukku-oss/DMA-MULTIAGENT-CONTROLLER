\# DMA FSM Algorithm

\*\*Contributor:\*\* Vishal  

\*\*Assigned Role:\*\* Algorithm Lead



\## 1. Introduction



DMA stands for Direct Memory Access. It allows data to be transferred between memory locations without requiring the CPU to control every individual transfer.



A Finite State Machine (FSM) controls the different stages of the DMA transfer process.



\## 2. Nine FSM States



The DMA controller uses the following nine states:



1\. \*\*IDLE:\*\* Initial state where the controller waits for a transfer request.

2\. \*\*REQ:\*\* Handles the DMA request.

3\. \*\*GRANT:\*\* Handles the grant of bus access.

4\. \*\*READ:\*\* Handles reading data from the source.

5\. \*\*LATCH:\*\* Holds the data temporarily.

6\. \*\*WRITE:\*\* Handles writing data to the destination.

7\. \*\*UPDATE:\*\* Handles transfer progress updates.

8\. \*\*DONE:\*\* Indicates completion of the transfer.

9\. \*\*ERROR:\*\* Handles an invalid transfer or error condition.



\## 3. Transfer Algorithm



The DMA transfer involves three important values:



\- Source address

\- Destination address

\- Word count



During a transfer, data is read from the source and written to the destination. The transfer progress is tracked using the source address, destination address and word count.



The exact address increment and word-count update logic must be verified against the DMA controller's RTL implementation.



\## 4. Overlapping Source and Destination



The project specifies that overlapping source and destination memory regions are rejected with error code 4.



This validation prevents an unsafe transfer when the source and destination regions overlap.



The exact overlap-checking conditions should be verified from the RTL implementation.



\## 5. Cycle Count Calculation



The project specifies the following cycle-count formula:



\*\*Total Cycles = (4 × Number of Words) + 4\*\*



Here:

\- 4 cycles are required per word.

\- 4 additional cycles are used as overhead.



For example, for 5 words:



Total Cycles = (4 × 5) + 4 = 24 cycles.



\## 6. Conclusion



The DMA FSM organizes the data-transfer process into different states. It tracks transfer progress, handles completion and identifies invalid transfer conditions.

